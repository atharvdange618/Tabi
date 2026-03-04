import { Router } from "express";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import { updateDaySchema } from "../../../shared/validations/index.ts";
import * as dayController from "../controllers/day.controller.ts";

const router = Router({ mergeParams: true });
const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/days
router.get("/", ...auth, requireMembership(), dayController.getTripDays);

// PATCH /api/v1/trips/:id/days/:dayId
router.patch(
  "/:dayId",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(updateDaySchema),
  dayController.updateDay,
);

export default router;
