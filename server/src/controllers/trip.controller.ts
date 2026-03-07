import type { Request, Response } from "express";
import * as tripService from "../services/trip.service.ts";
import type {
  CreateTripPayload,
  UpdateTripPayload,
} from "../../../shared/validations/index.ts";

/**
 * POST /api/v1/trips
 * Create a new trip. Requires auth + resolveDbUser.
 */
export async function createTrip(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const trip = await tripService.createTrip(
    userId,
    req.body as CreateTripPayload,
  );
  res.status(201).json({ data: trip });
}

/**
 * GET /api/v1/trips
 * Return all trips the authenticated user is an active member of.
 */
export async function getUserTrips(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const trips = await tripService.getUserTrips(userId);
  res.json({ data: trips });
}

/**
 * GET /api/v1/trips/public/:id
 * Return a public trip by ID. No auth required.
 */
export async function getPublicTripById(
  req: Request,
  res: Response,
): Promise<void> {
  const trip = await tripService.getPublicTripById(req.params.id as string);
  res.json({ data: trip });
}

/**
 * GET /api/v1/trips/:id
 * Return a single trip by ID. Requires membership (any role).
 */
export async function getTripById(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const trip = await tripService.getTripById(req.params.id as string, userId);
  res.json({ data: trip });
}

/**
 * PATCH /api/v1/trips/:id
 * Update mutable trip fields. Requires owner role.
 */
export async function updateTrip(req: Request, res: Response): Promise<void> {
  const trip = await tripService.updateTrip(
    req.params.id as string,
    req.body as UpdateTripPayload,
  );
  res.json({ data: trip });
}

/**
 * DELETE /api/v1/trips/:id
 * Hard-delete a trip and all its child data. Requires owner role.
 */
export async function deleteTripCascade(
  req: Request,
  res: Response,
): Promise<void> {
  await tripService.deleteTripCascade(req.params.id as string);
  res.status(204).send();
}

/**
 * POST /api/v1/trips/:id/cover
 * Upload a cover image for a trip. Requires owner role.
 */
export async function uploadCoverImage(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  const trip = await tripService.uploadCoverImage(
    req.params.id as string,
    req.file,
  );
  res.json({ data: trip });
}
