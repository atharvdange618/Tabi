import { Router } from "express";
import * as checklistController from "../controllers/checklist.controller.ts";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  createChecklistSchema,
  updateChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from "../../../shared/validations/index.ts";

const router = Router({ mergeParams: true });

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/checklists
router.get(
  "/",
  ...auth,
  requireMembership(),
  checklistController.getChecklists,
);

// POST /api/v1/trips/:id/checklists
router.post(
  "/",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(createChecklistSchema),
  checklistController.createChecklist,
);

// PATCH /api/v1/trips/:id/checklists/:clId
router.patch(
  "/:clId",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(updateChecklistSchema),
  checklistController.updateChecklist,
);

// DELETE /api/v1/trips/:id/checklists/:clId
router.delete(
  "/:clId",
  ...auth,
  requireRole(["owner", "editor"]),
  checklistController.deleteChecklist,
);

// POST /api/v1/trips/:id/checklists/:clId/items
router.post(
  "/:clId/items",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(createChecklistItemSchema),
  checklistController.createItem,
);

// PATCH /api/v1/trips/:id/checklists/:clId/items/:itemId
router.patch(
  "/:clId/items/:itemId",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(updateChecklistItemSchema),
  checklistController.updateItem,
);

// DELETE /api/v1/trips/:id/checklists/:clId/items/:itemId
router.delete(
  "/:clId/items/:itemId",
  ...auth,
  requireRole(["owner", "editor"]),
  checklistController.deleteItem,
);

export default router;
