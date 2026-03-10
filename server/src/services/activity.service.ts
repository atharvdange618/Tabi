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

  return activity;
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

  return activity;
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
