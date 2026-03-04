import type { Request, Response } from "express";
import * as checklistService from "../services/checklist.service.ts";
import type {
  CreateChecklistPayload,
  UpdateChecklistPayload,
  CreateChecklistItemPayload,
  UpdateChecklistItemPayload,
} from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/checklists
 * Retrieve all checklists (with items) for a trip.
 */
export async function getChecklists(
  req: Request,
  res: Response,
): Promise<void> {
  const checklists = await checklistService.getChecklists(
    req.params.id as string,
  );
  res.json({ data: checklists });
}

/**
 * POST /api/v1/trips/:id/checklists
 * Create a new checklist.
 */
export async function createChecklist(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const checklist = await checklistService.createChecklist(
    req.params.id as string,
    req.dbUserId,
    req.body as CreateChecklistPayload,
  );
  res.status(201).json({ data: checklist });
}

/**
 * PATCH /api/v1/trips/:id/checklists/:clId
 * Update a checklist's title.
 */
export async function updateChecklist(
  req: Request,
  res: Response,
): Promise<void> {
  const checklist = await checklistService.updateChecklist(
    req.params.id as string,
    req.params.clId as string,
    req.body as UpdateChecklistPayload,
  );
  res.json({ data: checklist });
}

/**
 * DELETE /api/v1/trips/:id/checklists/:clId
 * Delete a checklist and all its items.
 */
export async function deleteChecklist(
  req: Request,
  res: Response,
): Promise<void> {
  await checklistService.deleteChecklist(
    req.params.id as string,
    req.params.clId as string,
  );
  res.status(204).send();
}

/**
 * POST /api/v1/trips/:id/checklists/:clId/items
 * Add an item to a checklist.
 */
export async function createItem(req: Request, res: Response): Promise<void> {
  const item = await checklistService.createItem(
    req.params.id as string,
    req.params.clId as string,
    req.body as CreateChecklistItemPayload,
  );
  res.status(201).json({ data: item });
}

/**
 * PATCH /api/v1/trips/:id/checklists/:clId/items/:itemId
 * Update a checklist item (label, isChecked).
 */
export async function updateItem(req: Request, res: Response): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const item = await checklistService.updateItem(
    req.params.id as string,
    req.params.clId as string,
    req.params.itemId as string,
    req.dbUserId,
    req.body as UpdateChecklistItemPayload,
  );
  res.json({ data: item });
}

/**
 * DELETE /api/v1/trips/:id/checklists/:clId/items/:itemId
 * Delete a checklist item.
 */
export async function deleteItem(req: Request, res: Response): Promise<void> {
  await checklistService.deleteItem(
    req.params.id as string,
    req.params.clId as string,
    req.params.itemId as string,
  );
  res.status(204).send();
}
