import mongoose from "mongoose";
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

  const trip = await Trip.create({
    title: payload.title,
    description: payload.description ?? "",
    startDate,
    endDate,
    travelerCount: payload.travelerCount ?? 1,
    coverImageUrl: payload.coverImageUrl ?? "",
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  await TripMember.create({
    tripId: trip._id,
    userId: new mongoose.Types.ObjectId(userId),
    role: TripMemberRole.OWNER,
    status: TripMemberStatus.ACTIVE,
    invitedBy: new mongoose.Types.ObjectId(userId),
    joinedAt: new Date(),
  });

  const dates = getDatesInRange(startDate, endDate);
  if (dates.length > 0) {
    await Day.insertMany(
      dates.map((date) => ({ tripId: trip._id, date })),
      { ordered: false },
    );
  }

  return trip;
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

  type PopulatedMembership = (typeof memberships)[number] & {
    tripId: Record<string, unknown>;
  };

  return (memberships as PopulatedMembership[])
    .filter((m) => m.tripId != null)
    .map((m) => ({ ...m.tripId, role: m.role }))
    .sort((a, b) => {
      const aDate = new Date(
        (a as Record<string, unknown>).createdAt as string,
      ).getTime();
      const bDate = new Date(
        (b as Record<string, unknown>).createdAt as string,
      ).getTime();
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

  if (!trip) throw new NotFoundError("Trip not found");
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
  if (!trip) throw new NotFoundError("Trip not found");

  const updates: Record<string, unknown> = {};
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined)
    updates.description = payload.description;
  if (payload.travelerCount !== undefined)
    updates.travelerCount = payload.travelerCount;
  if (payload.coverImageUrl !== undefined)
    updates.coverImageUrl = payload.coverImageUrl;

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
    session.endSession();
  }

  return await Trip.findById(tripId); // Return the updated trip after the transaction
}

/**
 * Hard-delete a trip and every document across all 12 child collections.
 * ChecklistItems are handled separately because they reference Checklist, not Trip.
 */
export async function deleteTripCascade(tripId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new NotFoundError("Trip not found");

  const checklistIds = await Checklist.find({ tripId }).distinct("_id");

  await Promise.all([
    TripMember.deleteMany({ tripId }),
    PendingInvite.deleteMany({ tripId }),
    Day.deleteMany({ tripId }),
    Activity.deleteMany({ tripId }),
    Comment.deleteMany({ tripId }),
    Checklist.deleteMany({ tripId }),
    File.deleteMany({ tripId }),
    Reservation.deleteMany({ tripId }),
    BudgetSettings.deleteMany({ tripId }),
    Expense.deleteMany({ tripId }),
    checklistIds.length > 0
      ? ChecklistItem.deleteMany({ checklistId: { $in: checklistIds } })
      : Promise.resolve(),
  ]);

  await Trip.findByIdAndDelete(tripId);
}
