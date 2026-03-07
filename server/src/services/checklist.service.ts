import mongoose from "mongoose";
import { Checklist, ChecklistItem } from "../models/index.ts";
import { LimitExceededError, NotFoundError } from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
import type {
  CreateChecklistPayload,
  UpdateChecklistPayload,
  CreateChecklistItemPayload,
  UpdateChecklistItemPayload,
} from "../../../shared/validations/index.ts";

/**
 * Get all checklists for a trip, each with its items sorted by position.
 */
export async function getChecklists(tripId: string) {
  const checklists = await Checklist.find({ tripId })
    .sort({ position: 1 })
    .lean();

  const checklistIds = checklists.map((cl) => cl._id);
  const items = await ChecklistItem.find({
    checklistId: { $in: checklistIds },
  })
    .sort({ position: 1 })
    .lean();

  return checklists.map((cl) => ({
    ...cl,
    items: items.filter(
      (item) => item.checklistId.toString() === cl._id.toString(),
    ),
  }));
}

/**
 * Create a new checklist for a trip, appended at the end.
 */
export async function createChecklist(
  tripId: string,
  userId: string,
  payload: CreateChecklistPayload,
) {
  const checklistCount = await Checklist.countDocuments({ tripId });
  if (checklistCount >= LIMITS.CHECKLISTS_PER_TRIP) {
    throw new LimitExceededError(
      `A trip can have at most ${LIMITS.CHECKLISTS_PER_TRIP} checklists (${checklistCount}/${LIMITS.CHECKLISTS_PER_TRIP})`,
    );
  }

  const lastChecklist = await Checklist.findOne({ tripId })
    .sort({ position: -1 })
    .lean();

  const nextPosition = lastChecklist ? lastChecklist.position + 1024 : 1024;

  return Checklist.create({
    tripId: new mongoose.Types.ObjectId(tripId),
    title: payload.title,
    position: nextPosition,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
}

/**
 * Update a checklist's title.
 */
export async function updateChecklist(
  tripId: string,
  clId: string,
  payload: UpdateChecklistPayload,
) {
  const checklist = await Checklist.findOneAndUpdate(
    { _id: clId, tripId },
    { $set: payload },
    { new: true, runValidators: true },
  ).lean();

  if (!checklist) {
    throw new NotFoundError("Checklist not found");
  }

  return checklist;
}

/**
 * Delete a checklist and all its items.
 */
export async function deleteChecklist(tripId: string, clId: string) {
  const result = await Checklist.deleteOne({ _id: clId, tripId });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Checklist not found");
  }

  await ChecklistItem.deleteMany({ checklistId: clId });
}

/**
 * Add an item to a checklist.
 */
export async function createItem(
  tripId: string,
  clId: string,
  payload: CreateChecklistItemPayload,
) {
  const checklist = await Checklist.findOne({ _id: clId, tripId }).lean();
  if (!checklist) {
    throw new NotFoundError("Checklist not found");
  }

  const itemCount = await ChecklistItem.countDocuments({ checklistId: clId });
  if (itemCount >= LIMITS.ITEMS_PER_CHECKLIST) {
    throw new LimitExceededError(
      `A checklist can have at most ${LIMITS.ITEMS_PER_CHECKLIST} items (${itemCount}/${LIMITS.ITEMS_PER_CHECKLIST})`,
    );
  }

  const lastItem = await ChecklistItem.findOne({ checklistId: clId })
    .sort({ position: -1 })
    .lean();

  const nextPosition = lastItem ? lastItem.position + 1024 : 1024;

  return ChecklistItem.create({
    checklistId: new mongoose.Types.ObjectId(clId),
    label: payload.label,
    position: nextPosition,
  });
}

/**
 * Update an item (label, isChecked). When toggling isChecked,
 * also sets/clears checkedBy and checkedAt.
 */
export async function updateItem(
  tripId: string,
  clId: string,
  itemId: string,
  userId: string,
  payload: UpdateChecklistItemPayload,
) {
  const checklist = await Checklist.findOne({ _id: clId, tripId }).lean();
  if (!checklist) {
    throw new NotFoundError("Checklist not found");
  }

  const updateFields: Record<string, unknown> = {};

  if (payload.label !== undefined) {
    updateFields.label = payload.label;
  }

  if (payload.isChecked !== undefined) {
    updateFields.isChecked = payload.isChecked;
    if (payload.isChecked) {
      updateFields.checkedBy = new mongoose.Types.ObjectId(userId);
      updateFields.checkedAt = new Date();
    } else {
      updateFields.checkedBy = null;
      updateFields.checkedAt = null;
    }
  }

  const item = await ChecklistItem.findOneAndUpdate(
    { _id: itemId, checklistId: clId },
    { $set: updateFields },
    { new: true, runValidators: true },
  ).lean();

  if (!item) {
    throw new NotFoundError("Checklist item not found");
  }

  return item;
}

/**
 * Delete a single checklist item.
 */
export async function deleteItem(tripId: string, clId: string, itemId: string) {
  const checklist = await Checklist.findOne({ _id: clId, tripId }).lean();
  if (!checklist) {
    throw new NotFoundError("Checklist not found");
  }

  const result = await ChecklistItem.deleteOne({
    _id: itemId,
    checklistId: clId,
  });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Checklist item not found");
  }
}
