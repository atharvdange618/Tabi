import mongoose from "mongoose";
import { Activity, Day, Trip } from "../models/index.ts";
import { LimitExceededError, NotFoundError } from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
import {
  notificationEvents,
  NotificationEvents,
} from "../lib/notificationEmitter.ts";
import type {
  CreateActivityPayload,
  UpdateActivityPayload,
  ReorderActivitiesPayload,
} from "../../../shared/validations/index.ts";
import logger from "../lib/logger.ts";

// ── Time conflict helpers ─────────────────────────────────────────────────────

/**
 * Convert a 12-hour time string ("h:mm AM/PM") to total minutes from midnight.
 * Returns null if the string cannot be parsed.
 */
function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time);
  if (!match) {
    return null;
  }
  const [, hourStr, minStr, period] = match as unknown as [
    string,
    string,
    string,
    string,
  ];
  let h = parseInt(hourStr, 10);
  const m = parseInt(minStr, 10);
  if (period.toUpperCase() === "AM" && h === 12) {
    h = 0;
  }
  if (period.toUpperCase() === "PM" && h !== 12) {
    h += 12;
  }
  return h * 60 + m;
}

/**
 * Returns true if the candidate time range overlaps with any activity in the
 * provided list. Pass excludeId to skip an activity (used on updates).
 */
function detectTimeConflict(
  activities: {
    _id: { toString(): string };
    startTime?: string | null;
    endTime?: string | null;
  }[],
  excludeId: string | null,
  candidateStart: string,
  candidateEnd?: string | null,
): boolean {
  const candStart = parseTimeToMinutes(candidateStart);
  if (candStart === null) {
    return false;
  }
  const candEnd = candidateEnd
    ? (parseTimeToMinutes(candidateEnd) ?? candStart + 60)
    : candStart + 60;

  for (const act of activities) {
    if (excludeId && act._id.toString() === excludeId) {
      continue;
    }
    if (!act.startTime) {
      continue;
    }
    const actStart = parseTimeToMinutes(act.startTime);
    if (actStart === null) {
      continue;
    }
    const actEnd = act.endTime
      ? (parseTimeToMinutes(act.endTime) ?? actStart + 60)
      : actStart + 60;
    if (candStart < actEnd && actStart < candEnd) {
      return true;
    }
  }
  return false;
}

/**
 * Get all activities for a specific day, ordered by position.
 */
export async function getActivitiesForDay(tripId: string, dayId: string) {
  const day = await Day.findOne({ _id: dayId, tripId }).lean();
  if (!day) {
    throw new NotFoundError("Day not found");
  }

  return Activity.find({ dayId, tripId }).sort({ position: 1 }).lean();
}

/**
 * Get all activities across every day of a trip.
 * Used by the calendar view to fetch data in a single request.
 */
export async function getActivitiesForTrip(tripId: string) {
  return Activity.find({ tripId }).sort({ dayId: 1, position: 1 }).lean();
}

/**
 * Creates a new activity. Appends it to the end of the day by calculating
 * the highest current position + 1024.
 */
export async function createActivity(
  tripId: string,
  dayId: string,
  userId: string,
  payload: CreateActivityPayload,
) {
  const day = await Day.findOne({ _id: dayId, tripId }).lean();
  if (!day) {
    throw new NotFoundError("Day not found");
  }

  const activityCount = await Activity.countDocuments({ dayId });
  if (activityCount >= LIMITS.ACTIVITIES_PER_DAY) {
    throw new LimitExceededError(
      `A day can have at most ${LIMITS.ACTIVITIES_PER_DAY} activities (${activityCount}/${LIMITS.ACTIVITIES_PER_DAY})`,
    );
  }

  const lastActivity = await Activity.findOne({ dayId })
    .sort({ position: -1 })
    .lean();

  const nextPosition = lastActivity ? lastActivity.position + 1024 : 1024;

  const activity = await Activity.create({
    ...payload,
    tripId: new mongoose.Types.ObjectId(tripId),
    dayId: new mongoose.Types.ObjectId(dayId),
    createdBy: new mongoose.Types.ObjectId(userId),
    position: nextPosition,
  });

  // Detect time conflicts against the other activities already in the day
  const warnings: string[] = [];
  if (payload.startTime) {
    const existing = await Activity.find({ dayId, tripId }).lean();
    if (
      detectTimeConflict(
        existing,
        activity._id.toString(),
        payload.startTime,
        payload.endTime,
      )
    ) {
      warnings.push("time_conflict");
    }
  }

  try {
    const trip = await Trip.findById(tripId).lean();
    if (trip) {
      notificationEvents.emit(NotificationEvents.ACTIVITY_UPDATED, {
        tripId,
        tripTitle: trip.title,
        activityId: activity._id.toString(),
        updatedByUserId: userId,
      });
    }
  } catch (error) {
    logger.error("Failed to emit activity updated event", {
      error,
      activityId: activity._id,
    });
  }

  return { activity, warnings };
}

/**
 * Simple patch update for activity fields
 */
export async function updateActivity(
  tripId: string,
  dayId: string,
  activityId: string,
  updatedByUserId: string,
  payload: UpdateActivityPayload,
) {
  const activity = await Activity.findOneAndUpdate(
    { _id: activityId, dayId, tripId },
    { $set: payload },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!activity) {
    throw new NotFoundError("Activity not found");
  }

  // Detect time conflicts with other activities on the same day
  const warnings: string[] = [];
  const checkStart =
    payload.startTime ?? (activity.startTime as string | undefined);
  if (checkStart) {
    const checkEnd =
      payload.endTime ?? (activity.endTime as string | undefined);
    const others = await Activity.find({ dayId, tripId }).lean();
    if (detectTimeConflict(others, activityId, checkStart, checkEnd)) {
      warnings.push("time_conflict");
    }
  }

  try {
    const trip = await Trip.findById(tripId).lean();
    if (trip) {
      notificationEvents.emit(NotificationEvents.ACTIVITY_UPDATED, {
        tripId,
        tripTitle: trip.title,
        activityId,
        updatedByUserId,
      });
    }
  } catch (error) {
    logger.error("Failed to emit activity updated event", {
      error,
      activityId,
    });
  }

  return { activity, warnings };
}

/**
 * Deletes an activity
 */
export async function deleteActivity(
  tripId: string,
  dayId: string,
  activityId: string,
  deletedByUserId: string,
) {
  const activity = await Activity.findOne({
    _id: activityId,
    dayId,
    tripId,
  }).lean();

  const result = await Activity.deleteOne({ _id: activityId, dayId, tripId });

  if (result.deletedCount === 0) {
    throw new NotFoundError("Activity not found");
  }

  try {
    const trip = await Trip.findById(tripId).lean();
    if (trip && activity) {
      notificationEvents.emit(NotificationEvents.ACTIVITY_UPDATED, {
        tripId,
        tripTitle: trip.title,
        activityId,
        updatedByUserId: deletedByUserId,
      });
    }
  } catch (error) {
    logger.error("Failed to emit activity deleted event", {
      error,
      activityId,
    });
  }
}

/**
 * Reorders activities in bulk
 */
export async function reorderActivities(
  tripId: string,
  dayId: string,
  payload: ReorderActivitiesPayload,
) {
  const day = await Day.findOne({ _id: dayId, tripId }).lean();
  if (!day) {
    throw new NotFoundError("Day not found");
  }

  const bulkOps = payload.activities.map((act) => ({
    updateOne: {
      filter: { _id: act._id, dayId, tripId },
      update: { $set: { position: act.position } },
    },
  }));

  if (bulkOps.length > 0) {
    await Activity.bulkWrite(bulkOps);
  }
}
