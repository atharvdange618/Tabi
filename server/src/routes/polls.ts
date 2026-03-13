import { Router } from "express";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  createPollSchema,
  votePollSchema,
  closePollSchema,
} from "../../../shared/validations/index.ts";
import * as pollController from "../controllers/poll.controller.ts";

const router = Router({ mergeParams: true });

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/polls   all active members can view
router.get("/", ...auth, requireMembership(), pollController.getPolls);

// POST /api/v1/trips/:id/polls   owner/editor can create
router.post(
  "/",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(createPollSchema),
  pollController.createPoll,
);

// POST /api/v1/trips/:id/polls/:pollId/vote   all active members can vote
router.post(
  "/:pollId/vote",
  ...auth,
  requireMembership(),
  validate(votePollSchema),
  pollController.votePoll,
);

// PATCH /api/v1/trips/:id/polls/:pollId/close   owner/editor can close
router.patch(
  "/:pollId/close",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(closePollSchema),
  pollController.closePoll,
);

// DELETE /api/v1/trips/:id/polls/:pollId   owner/editor can delete
router.delete(
  "/:pollId",
  ...auth,
  requireRole(["owner", "editor"]),
  pollController.deletePoll,
);

export default router;
