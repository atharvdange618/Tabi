import { Router } from "express";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  createActivitySchema,
  updateActivitySchema,
  reorderActivitiesSchema,
} from "../../../shared/validations/index.ts";
import * as activityController from "../controllers/activity.controller.ts";

const router = Router({ mergeParams: true });

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/days/:dayId/activities
router.get("/", ...auth, requireMembership(), activityController.getActivities);

// POST /api/v1/trips/:id/days/:dayId/activities
router.post(
  "/",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(createActivitySchema),
  activityController.createActivity,
);

// PATCH /api/v1/trips/:id/days/:dayId/activities/reorder
router.patch(
  "/reorder",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(reorderActivitiesSchema),
  activityController.reorderActivities,
);

// PATCH /api/v1/trips/:id/days/:dayId/activities/:actId
router.patch(
  "/:actId",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(updateActivitySchema),
  activityController.updateActivity,
);

// DELETE /api/v1/trips/:id/days/:dayId/activities/:actId
router.delete(
  "/:actId",
  ...auth,
  requireRole(["owner", "editor"]),
  activityController.deleteActivity,
);

export default router;
