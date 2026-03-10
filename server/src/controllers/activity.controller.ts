import type { Request, Response } from "express";
import * as activityService from "../services/activity.service.ts";
import type {
  CreateActivityPayload,
  UpdateActivityPayload,
  ReorderActivitiesPayload,
} from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/activities
 * Retrieve all activities for every day of a trip (used by calendar view).
 */
export async function getAllTripActivities(
  req: Request,
  res: Response,
): Promise<void> {
  const activities = await activityService.getActivitiesForTrip(
    req.params.id as string,
  );
  res.json({ data: activities });
}

/**
 * GET /api/v1/trips/:id/days/:dayId/activities
 * Retrieve all activities for a day
 */
export async function getActivities(
  req: Request,
  res: Response,
): Promise<void> {
  const activities = await activityService.getActivitiesForDay(
    req.params.id as string,
    req.params.dayId as string,
  );
  res.json({ data: activities });
}

/**
 * POST /api/v1/trips/:id/days/:dayId/activities
 * Create a new activity for a day
 */
export async function createActivity(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const activity = await activityService.createActivity(
    req.params.id as string,
    req.params.dayId as string,
    req.dbUserId,
    req.body as CreateActivityPayload,
  );
  res.status(201).json({ data: activity });
}

/**
 * PATCH /api/v1/trips/:id/days/:dayId/activities/:actId
 * Update an existing activity
 */
export async function updateActivity(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const activity = await activityService.updateActivity(
    req.params.id as string,
    req.params.dayId as string,
    req.params.actId as string,
    req.dbUserId,
    req.body as UpdateActivityPayload,
  );
  res.json({ data: activity });
}

/**
 * DELETE /api/v1/trips/:id/days/:dayId/activities/:actId
 * Delete an activity
 */
export async function deleteActivity(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  await activityService.deleteActivity(
    req.params.id as string,
    req.params.dayId as string,
    req.params.actId as string,
    req.dbUserId,
  );
  res.status(204).send();
}

/**
 * PATCH /api/v1/trips/:id/days/:dayId/activities/reorder
 * Reorder activities for a day
 */
export async function reorderActivities(
  req: Request,
  res: Response,
): Promise<void> {
  await activityService.reorderActivities(
    req.params.id as string,
    req.params.dayId as string,
    req.body as ReorderActivitiesPayload,
  );
  res.json({ message: "Activities reordered" });
}
