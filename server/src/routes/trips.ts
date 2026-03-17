import { Router } from "express";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  createTripSchema,
  updateTripSchema,
} from "../../../shared/validations/index.ts";
import * as tripController from "../controllers/trip.controller.ts";
import * as activityController from "../controllers/activity.controller.ts";
import { upload } from "../middleware/upload.ts";

const router = Router();

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/discover - discover public trips with filtering
router.get("/discover", tripController.getDiscoverTrips);

// GET /api/v1/trips/public/:id - fetch a public trip
router.get("/public/:id", tripController.getPublicTripById);

// GET /api/v1/trips - list all trips the user is a member of
router.get("/", ...auth, tripController.getUserTrips);

// POST /api/v1/trips - create a new trip
router.post(
  "/",
  ...auth,
  validate(createTripSchema),
  tripController.createTrip,
);

// GET /api/v1/trips/:id/activities - fetch all activities for a trip
router.get(
  "/:id/activities",
  ...auth,
  requireMembership(),
  activityController.getAllTripActivities,
);

// GET /api/v1/trips/:id - fetch a single trip (any member)
router.get("/:id", ...auth, requireMembership(), tripController.getTripById);

// PATCH /api/v1/trips/:id - update trip fields (owner only)
router.patch(
  "/:id",
  ...auth,
  requireRole(["owner"]),
  validate(updateTripSchema),
  tripController.updateTrip,
);

// DELETE /api/v1/trips/:id - cascade-delete the trip (owner only)
router.delete(
  "/:id",
  ...auth,
  requireRole(["owner"]),
  tripController.deleteTripCascade,
);

// POST /api/v1/trips/:id/cover - upload cover image (owner only)
router.post(
  "/:id/cover",
  ...auth,
  requireRole(["owner"]),
  upload.single("cover"),
  tripController.uploadCoverImage,
);

export default router;
