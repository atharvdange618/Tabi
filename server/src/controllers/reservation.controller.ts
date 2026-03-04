import type { Request, Response } from "express";
import * as reservationService from "../services/reservation.service.ts";
import type {
  CreateReservationPayload,
  UpdateReservationPayload,
} from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/reservations
 * Retrieve all reservations for a trip.
 */
export async function getReservations(
  req: Request,
  res: Response,
): Promise<void> {
  const reservations = await reservationService.getReservations(
    req.params.id as string,
  );
  res.json({ data: reservations });
}

/**
 * POST /api/v1/trips/:id/reservations
 * Create a new reservation.
 */
export async function createReservation(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const reservation = await reservationService.createReservation(
    req.params.id as string,
    req.dbUserId,
    req.body as CreateReservationPayload,
  );
  res.status(201).json({ data: reservation });
}

/**
 * PATCH /api/v1/trips/:id/reservations/:resId
 * Update a reservation.
 */
export async function updateReservation(
  req: Request,
  res: Response,
): Promise<void> {
  const reservation = await reservationService.updateReservation(
    req.params.id as string,
    req.params.resId as string,
    req.body as UpdateReservationPayload,
  );
  res.json({ data: reservation });
}

/**
 * DELETE /api/v1/trips/:id/reservations/:resId
 * Delete a reservation.
 */
export async function deleteReservation(
  req: Request,
  res: Response,
): Promise<void> {
  await reservationService.deleteReservation(
    req.params.id as string,
    req.params.resId as string,
  );
  res.status(204).send();
}
