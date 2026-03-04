import { Router } from "express";
import * as reservationController from "../controllers/reservation.controller.ts";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  createReservationSchema,
  updateReservationSchema,
} from "../../../shared/validations/index.ts";

const router = Router({ mergeParams: true });

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/reservations
router.get(
  "/",
  ...auth,
  requireMembership(),
  reservationController.getReservations,
);

// POST /api/v1/trips/:id/reservations
router.post(
  "/",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(createReservationSchema),
  reservationController.createReservation,
);

// PATCH /api/v1/trips/:id/reservations/:resId
router.patch(
  "/:resId",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(updateReservationSchema),
  reservationController.updateReservation,
);

// DELETE /api/v1/trips/:id/reservations/:resId
router.delete(
  "/:resId",
  ...auth,
  requireRole(["owner", "editor"]),
  reservationController.deleteReservation,
);

export default router;
