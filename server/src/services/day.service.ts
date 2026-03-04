import { Day } from "../models/index.ts";
import { NotFoundError } from "../lib/errors.ts";
import type { UpdateDayPayload } from "../../../shared/validations/index.ts";

/**
 * Retrieve all auto-generated days for a specific trip, ordered chronologically.
 */
export async function getTripDays(tripId: string) {
  return Day.find({ tripId }).sort({ date: 1 }).lean();
}

/**
 * Update a Day document's label or notes.
 */
export async function updateDay(
  tripId: string,
  dayId: string,
  payload: UpdateDayPayload,
) {
  const day = await Day.findOneAndUpdate(
    { _id: dayId, tripId },
    { $set: payload },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!day) {
    throw new NotFoundError("Day not found");
  }

  return day;
}
