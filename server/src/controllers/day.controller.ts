import type { Request, Response } from "express";
import * as dayService from "../services/day.service.ts";
import { updateDaySchema } from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/days
 * Retrieve all days for a trip
 */
export async function getTripDays(req: Request, res: Response): Promise<void> {
  const days = await dayService.getTripDays(req.params.id as string);
  res.json({ data: days });
}

/**
 * PATCH /api/v1/trips/:id/days/:dayId
 * Update a day's label or notes
 */
export async function updateDay(req: Request, res: Response): Promise<void> {
  const parseResult = updateDaySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Invalid payload",
      details: parseResult.error.issues,
    });
    return;
  }

  const day = await dayService.updateDay(
    req.params.id as string,
    req.params.dayId as string,
    parseResult.data,
  );
  res.json({ data: day });
}
