import mongoose, { type HydratedDocument } from "mongoose";
import streamifier from "streamifier";
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
import {
  ForbiddenError,
  LimitExceededError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";
import type {
  CreateTripPayload,
  UpdateTripPayload,
} from "../../../shared/validations/index.ts";
import { dateKey, getDatesInRange } from "../lib/helpers.ts";
import cloudinary from "../lib/cloudinary.ts";

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

  const ownedTrips = await Trip.countDocuments({
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  if (ownedTrips >= LIMITS.TRIPS_PER_USER) {
    throw new LimitExceededError(
      `You can own at most ${LIMITS.TRIPS_PER_USER} trips (${ownedTrips}/${LIMITS.TRIPS_PER_USER})`,
    );
  }

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
            destination: payload.destination ?? "",
            startDate,
            endDate,
            travelerCount: payload.travelerCount ?? 1,
            coverImageUrl: payload.coverImageUrl ?? "",
            isPublic: payload.isPublic ?? false,
            tags: payload.tags ?? [],
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

      if (payload.initialBudget !== undefined) {
        await BudgetSettings.create(
          [
            {
              tripId: created._id,
              totalBudget: payload.initialBudget,
            },
          ],
          { session },
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
 * Each trip is enriched with memberCount, activityCount, and the members list (active only).
 */
export async function getUserTrips(userId: string) {
  const memberships = await TripMember.find({
    userId: new mongoose.Types.ObjectId(userId),
    status: TripMemberStatus.ACTIVE,
  })
    .populate("tripId")
    .lean();

  const trips = memberships
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

  if (trips.length === 0) {
    return [];
  }

  const tripsAsRecords = trips as unknown as Record<string, unknown>[];
  const tripIds = tripsAsRecords.map((t) => t._id as mongoose.Types.ObjectId);

  const [memberCounts, activityCounts, tripMembersData] = await Promise.all([
    TripMember.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { tripId: { $in: tripIds }, status: TripMemberStatus.ACTIVE } },
      { $group: { _id: "$tripId", count: { $sum: 1 } } },
    ]),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { tripId: { $in: tripIds } } },
      { $group: { _id: "$tripId", count: { $sum: 1 } } },
    ]),
    TripMember.find({
      tripId: { $in: tripIds },
      status: TripMemberStatus.ACTIVE,
    })
      .populate("userId", "name email avatarUrl")
      .lean(),
  ]);

  const memberCountMap = new Map(
    memberCounts.map((m) => [m._id.toString(), m.count]),
  );
  const activityCountMap = new Map(
    activityCounts.map((a) => [a._id.toString(), a.count]),
  );

  const membersByTrip = new Map<
    string,
    { name: string; email: string; avatarUrl?: string }[]
  >();
  for (const m of tripMembersData) {
    const tripId = m.tripId.toString();
    const user = m.userId as unknown as {
      name: string;
      email: string;
      avatarUrl?: string;
    } | null;
    if (!user) {
      continue;
    }
    if (!membersByTrip.has(tripId)) {
      membersByTrip.set(tripId, []);
    }
    membersByTrip
      .get(tripId)
      ?.push({ name: user.name, email: user.email, avatarUrl: user.avatarUrl });
  }

  return tripsAsRecords.map((t) => {
    const tripId = (t._id as mongoose.Types.ObjectId).toString();
    return {
      ...t,
      memberCount: memberCountMap.get(tripId) ?? 0,
      activityCount: activityCountMap.get(tripId) ?? 0,
      members: membersByTrip.get(tripId) ?? [],
    };
  });
}

/**
 * Fetch a public trip by its ID, complete with members, days, and activities.
 */
export async function getPublicTripById(tripId: string) {
  const trip = await Trip.findById(tripId).lean();
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  if (!trip.isPublic) {
    throw new ForbiddenError("This trip is not publicly accessible");
  }

  const [days, activities, members] = await Promise.all([
    Day.find({ tripId }).sort({ date: 1 }).lean(),
    Activity.find({ tripId }).sort({ position: 1 }).lean(),
    TripMember.find({ tripId, status: TripMemberStatus.ACTIVE })
      .populate("userId", "name")
      .lean(),
  ]);

  const initialsList = members
    .map((m) => {
      const user = m.userId as unknown as { name?: string } | null;
      if (!user?.name) {
        return "";
      }
      const nameParts = user.name.split(" ").filter(Boolean);
      if (nameParts.length === 0) {
        return "";
      }
      if (nameParts.length === 1) {
        return nameParts[0]?.[0]?.toUpperCase() ?? "";
      }
      return (
        (nameParts[0]?.[0]?.toUpperCase() ?? "") +
        (nameParts[nameParts.length - 1]?.[0]?.toUpperCase() ?? "")
      );
    })
    .filter((initials) => initials.length > 0)
    .map((initials) => ({ initials }));

  return {
    _id: trip._id.toString(),
    title: trip.title,
    description: trip.description,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverImageUrl: trip.coverImageUrl,
    members: initialsList,
    days: days.map((d) => ({
      _id: d._id.toString(),
      date: d.date,
      label: d.label,
      notes: d.notes,
    })),
    activities: activities.map((a) => ({
      _id: a._id.toString(),
      dayId: a.dayId.toString(),
      title: a.title,
      type: a.type,
      startTime: a.startTime,
      endTime: a.endTime,
      location: a.location,
      notes: a.notes,
      position: a.position,
    })),
  };
}

/**
 * Fetch a single trip by its MongoDB _id, with creator info populated.
 */
export async function getTripById(tripId: string, userId: string) {
  const [trip, membership] = await Promise.all([
    Trip.findById(tripId).populate("createdBy", "name email avatarUrl").lean(),
    TripMember.findOne({
      tripId: new mongoose.Types.ObjectId(tripId),
      userId: new mongoose.Types.ObjectId(userId),
      status: TripMemberStatus.ACTIVE,
    }).lean(),
  ]);

  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  return { ...trip, role: membership?.role ?? "viewer" };
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
  if (payload.destination !== undefined) {
    updates.destination = payload.destination;
  }
  if (payload.travelerCount !== undefined) {
    updates.travelerCount = payload.travelerCount;
  }
  if (payload.coverImageUrl !== undefined) {
    updates.coverImageUrl = payload.coverImageUrl;
  }
  if (payload.isPublic !== undefined) {
    updates.isPublic = payload.isPublic;
  }
  if (payload.tags !== undefined) {
    updates.tags = payload.tags;
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
    const diffDays =
      (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays + 1 > LIMITS.TRIP_MAX_DAYS) {
      throw new ValidationError(
        `Trip duration cannot exceed ${LIMITS.TRIP_MAX_DAYS} days`,
      );
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

  return await Trip.findById(tripId);
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

/**
 * Extract the Cloudinary public ID from a secure URL.
 */
function extractCloudinaryPublicId(url: string): string | null {
  const match = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/.exec(url);
  return match?.[1] ?? null;
}

/**
 * Upload a cover image for a trip to Cloudinary and persist the URL.
 * If the trip already has a cover image, it is deleted from Cloudinary
 * only after the new upload succeeds.
 */
export async function uploadCoverImage(
  tripId: string,
  file: Express.Multer.File,
) {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  if (file.buffer.length === 0) {
    throw new ValidationError("Empty file");
  }

  const oldCoverImageUrl = trip.coverImageUrl as string | undefined;

  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "tabi/covers",
          resource_type: "auto",
        },
        (error: unknown, res) => {
          if (error) {
            // eslint-disable-next-line no-console
            console.error("Cloudinary upload error:", error);
            const errMsg =
              error instanceof Error
                ? error.message
                : JSON.stringify(error) || "Upload failed";
            reject(new Error(errMsg));
            return;
          }
          if (!res) {
            reject(new Error("No result from Cloudinary"));
            return;
          }
          resolve({ secure_url: res.secure_url });
        },
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    },
  );

  if (oldCoverImageUrl) {
    const publicId = extractCloudinaryPublicId(oldCoverImageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("Failed to delete old cover image from Cloudinary:", err);
      });
    }
  }

  trip.coverImageUrl = result.secure_url;
  await trip.save();
  return trip;
}

/**
 * Get public trips for the discover page with filtering, search, and pagination
 */
export async function getPublicTripsForDiscover(options: {
  limit?: number;
  skip?: number;
  search?: string;
  destination?: string;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
}) {
  const {
    limit = 20,
    skip = 0,
    search,
    destination,
    tags,
    minDuration,
    maxDuration,
  } = options;

  const cappedLimit = Math.min(limit, 50);

  const query: Record<string, unknown> = { isPublic: true };

  if (search?.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [{ title: searchRegex }, { destination: searchRegex }];
  }

  if (destination?.trim()) {
    const destRegex = new RegExp(destination.trim(), "i");
    query.destination = destRegex;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  if (minDuration !== undefined || maxDuration !== undefined) {
    const durationConditions: unknown[] = [];

    if (minDuration !== undefined && minDuration > 0) {
      durationConditions.push({
        $gte: [
          {
            $divide: [
              { $subtract: ["$endDate", "$startDate"] },
              1000 * 60 * 60 * 24,
            ],
          },
          minDuration,
        ],
      });
    }

    if (maxDuration !== undefined && maxDuration > 0) {
      durationConditions.push({
        $lte: [
          {
            $divide: [
              { $subtract: ["$endDate", "$startDate"] },
              1000 * 60 * 60 * 24,
            ],
          },
          maxDuration,
        ],
      });
    }

    if (durationConditions.length > 0) {
      query.$expr = { $and: durationConditions };
    }
  }

  const [trips, total] = await Promise.all([
    Trip.find(query)
      .select(
        "title description destination startDate endDate coverImageUrl tags createdAt",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(cappedLimit)
      .lean(),
    Trip.countDocuments(query),
  ]);

  const tripIds = trips.map((trip) => trip._id);
  const memberCounts = await TripMember.aggregate([
    {
      $match: {
        tripId: { $in: tripIds },
        status: TripMemberStatus.ACTIVE,
      },
    },
    {
      $group: {
        _id: "$tripId",
        count: { $sum: 1 },
      },
    },
  ]);

  const memberCountMap = new Map(
    memberCounts.map((mc) => [mc._id.toString(), mc.count as number]),
  );

  const formattedTrips = trips.map((trip) => ({
    _id: trip._id.toString(),
    title: trip.title,
    description: trip.description,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverImageUrl: trip.coverImageUrl,
    tags: trip.tags,
    memberCount: memberCountMap.get(trip._id.toString()) ?? 0,
    createdAt: trip.createdAt,
  }));

  return {
    trips: formattedTrips,
    total,
    hasMore: skip + trips.length < total,
  };
}
