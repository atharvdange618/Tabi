import mongoose, { type HydratedDocument } from "mongoose";
import {
  Trip,
  TripMember,
  Day,
  Activity,
  Comment,
  Checklist,
  ChecklistItem,
  File,
  Reservation,
  BudgetSettings,
  Expense,
  PendingInvite,
} from "../models/index.ts";
import { NotFoundError, ValidationError } from "../lib/errors.ts";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";
import type {
  CreateTripPayload,
  UpdateTripPayload,
} from "../../../shared/validations/index.ts";
import { dateKey, getDatesInRange } from "../lib/helpers.ts";

type TripDoc = HydratedDocument<
  typeof Trip extends mongoose.Model<infer T> ? T : never
>;

/**
 * Create a new trip, seed it with an owner TripMember, and auto-generate
 * one Day document per calendar day in [startDate, endDate].
 */
export async function createTrip(userId: string, payload: CreateTripPayload) {
  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (endDate < startDate) {
    throw new ValidationError("endDate must be on or after startDate");
  }

  const session = await mongoose.startSession();
  try {
    let trip: TripDoc | undefined;
    await session.withTransaction(async () => {
      const [created] = await Trip.create(
        [
          {
            title: payload.title,
            description: payload.description ?? "",
            startDate,
            endDate,
            travelerCount: payload.travelerCount ?? 1,
            coverImageUrl: payload.coverImageUrl ?? "",
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session },
      );

      if (!created) {
        throw new Error("Failed to create trip document");
      }
      trip = created;

      await TripMember.create(
        [
          {
            tripId: created._id,
            userId: new mongoose.Types.ObjectId(userId),
            role: TripMemberRole.OWNER,
            status: TripMemberStatus.ACTIVE,
            invitedBy: new mongoose.Types.ObjectId(userId),
            joinedAt: new Date(),
          },
        ],
        { session },
      );

      const dates = getDatesInRange(startDate, endDate);
      if (dates.length > 0) {
        await Day.insertMany(
          dates.map((date) => ({ tripId: created._id, date })),
          { ordered: false, session },
        );
      }
    });

    if (!trip) {
      throw new Error("Transaction did not produce a trip");
    }
    return trip;
  } finally {
    void session.endSession();
  }
}

/**
 * Return all trips the authenticated user is an active member of, sorted by most recent creation date.
 */
export async function getUserTrips(userId: string) {
  const memberships = await TripMember.find({
    userId: new mongoose.Types.ObjectId(userId),
    status: TripMemberStatus.ACTIVE,
  })
    .populate("tripId")
    .lean();

  return memberships
    .map((m) => {
      const tripData = m.tripId as unknown as Record<string, unknown>;
      const createdAt = tripData.createdAt as Date | undefined;
      return { ...tripData, role: m.role, createdAt };
    })
    .sort((a, b) => {
      const aDate = new Date(a.createdAt ?? 0).getTime();
      const bDate = new Date(b.createdAt ?? 0).getTime();
      return bDate - aDate;
    });
}

/**
 * Fetch a single trip by its MongoDB _id, with creator info populated.
 */
export async function getTripById(tripId: string) {
  const trip = await Trip.findById(tripId)
    .populate("createdBy", "name email avatarUrl")
    .lean();

  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  return trip;
}

/**
 * Update a trip's mutable fields.
 * If the date range changes, Day documents are reconciled:
 *   - Days outside the new range (and their Activities) are deleted.
 *   - Missing days inside the new range are created.
 */
export async function updateTrip(tripId: string, payload: UpdateTripPayload) {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const updates: Record<string, unknown> = {};
  if (payload.title !== undefined) {
    updates.title = payload.title;
  }
  if (payload.description !== undefined) {
    updates.description = payload.description;
  }
  if (payload.travelerCount !== undefined) {
    updates.travelerCount = payload.travelerCount;
  }
  if (payload.coverImageUrl !== undefined) {
    updates.coverImageUrl = payload.coverImageUrl;
  }

  const oldStartDate = trip.startDate as Date;
  const oldEndDate = trip.endDate as Date;

  const newStartDate =
    payload.startDate !== undefined
      ? new Date(payload.startDate)
      : oldStartDate;
  const newEndDate =
    payload.endDate !== undefined ? new Date(payload.endDate) : oldEndDate;

  const datesChanged =
    payload.startDate !== undefined || payload.endDate !== undefined;

  if (datesChanged) {
    if (newEndDate < newStartDate) {
      throw new ValidationError("endDate must be on or after startDate");
    }
    updates.startDate = newStartDate;
    updates.endDate = newEndDate;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (datesChanged) {
        const oldKeys = new Set(
          getDatesInRange(oldStartDate, oldEndDate).map(dateKey),
        );
        const newKeys = new Set(
          getDatesInRange(newStartDate, newEndDate).map(dateKey),
        );

        const removedKeys = [...oldKeys].filter((k) => !newKeys.has(k));
        const addedKeys = [...newKeys].filter((k) => !oldKeys.has(k));

        if (removedKeys.length > 0) {
          const removedDates = removedKeys.map(
            (k) => new Date(`${k}T00:00:00.000Z`),
          );
          const daysToRemove = await Day.find({
            tripId,
            date: { $in: removedDates },
          })
            .select("_id")
            .session(session)
            .lean();

          const dayIds = daysToRemove.map((d) => d._id);

          await Promise.all([
            Day.deleteMany({ tripId, date: { $in: removedDates } }).session(
              session,
            ),
            dayIds.length > 0
              ? Activity.deleteMany({ dayId: { $in: dayIds } }).session(session)
              : Promise.resolve(),
          ]);
        }

        if (addedKeys.length > 0) {
          const addedDates = addedKeys.map(
            (k) => new Date(`${k}T00:00:00.000Z`),
          );
          await Day.insertMany(
            addedDates.map((date) => ({ tripId, date })),
            { ordered: false, session },
          );
        }
      }

      await Trip.findByIdAndUpdate(
        tripId,
        { $set: updates },
        { returnDocument: "after", session },
      );
    });
  } finally {
    void session.endSession();
  }

  return await Trip.findById(tripId); // Return the updated trip after the transaction
}

/**
 * Hard-delete a trip and every document across all 12 child collections.
 * ChecklistItems are handled separately because they reference Checklist, not Trip.
 */
export async function deleteTripCascade(tripId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const checklistIds = await Checklist.find({ tripId })
        .distinct("_id")
        .session(session);

      await Promise.all([
        TripMember.deleteMany({ tripId }).session(session),
        PendingInvite.deleteMany({ tripId }).session(session),
        Day.deleteMany({ tripId }).session(session),
        Activity.deleteMany({ tripId }).session(session),
        Comment.deleteMany({ tripId }).session(session),
        Checklist.deleteMany({ tripId }).session(session),
        File.deleteMany({ tripId }).session(session),
        Reservation.deleteMany({ tripId }).session(session),
        BudgetSettings.deleteMany({ tripId }).session(session),
        Expense.deleteMany({ tripId }).session(session),
        checklistIds.length > 0
          ? ChecklistItem.deleteMany({
              checklistId: { $in: checklistIds },
            }).session(session)
          : Promise.resolve(),
      ]);

      await Trip.findByIdAndDelete(tripId).session(session);
    });
  } finally {
    void session.endSession();
  }
}
