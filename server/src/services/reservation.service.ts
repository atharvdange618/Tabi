import mongoose from "mongoose";
import { Reservation, Trip } from "../models/index.ts";
import {
  notificationEvents,
  NotificationEvents,
} from "../lib/notificationEmitter.ts";
import { LimitExceededError, NotFoundError } from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
import type {
  CreateReservationPayload,
  UpdateReservationPayload,
} from "../../../shared/validations/index.ts";

/**
 * Get all reservations for a trip.
 */
export async function getReservations(tripId: string) {
  return Reservation.find({ tripId }).sort({ createdAt: -1 }).lean();
}

/**
 * Create a new reservation.
 */
export async function createReservation(
  tripId: string,
  userId: string,
  payload: CreateReservationPayload,
) {
  const reservationCount = await Reservation.countDocuments({ tripId });
  if (reservationCount >= LIMITS.RESERVATIONS_PER_TRIP) {
    throw new LimitExceededError(
      `A trip can have at most ${LIMITS.RESERVATIONS_PER_TRIP} reservations (${reservationCount}/${LIMITS.RESERVATIONS_PER_TRIP})`,
    );
  }

  const reservation = await Reservation.create({
    ...payload,
    tripId: new mongoose.Types.ObjectId(tripId),
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  const trip = await Trip.findById(tripId).select("title").lean();
  if (trip) {
    notificationEvents.emit(NotificationEvents.RESERVATION_ADDED, {
      tripId,
      tripTitle: trip.title,
      reservationId: reservation._id.toString(),
      addedByUserId: userId,
    });
  }

  return reservation;
}

/**
 * Update a reservation.
 */
export async function updateReservation(
  tripId: string,
  resId: string,
  payload: UpdateReservationPayload,
) {
  const reservation = await Reservation.findOneAndUpdate(
    { _id: resId, tripId },
    { $set: payload },
    { new: true, runValidators: true },
  ).lean();

  if (!reservation) {
    throw new NotFoundError("Reservation not found");
  }

  return reservation;
}

/**
 * Delete a reservation.
 */
export async function deleteReservation(tripId: string, resId: string) {
  const result = await Reservation.deleteOne({ _id: resId, tripId });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Reservation not found");
  }
}
