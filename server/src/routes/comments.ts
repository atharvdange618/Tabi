import { Router } from "express";
import * as commentController from "../controllers/comment.controller.ts";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../../../shared/validations/index.ts";

const router = Router({ mergeParams: true });

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/comments?targetType=day|activity&targetId=<id>
router.get(
  "/",
  ...auth,
  requireRole(["owner", "editor", "viewer"]),
  commentController.getComments,
);

// POST /api/v1/trips/:id/comments
router.post(
  "/",
  ...auth,
  requireRole(["owner", "editor", "viewer"]),
  validate(createCommentSchema),
  commentController.createComment,
);

// PATCH /api/v1/trips/:id/comments/:commentId
router.patch(
  "/:commentId",
  ...auth,
  requireRole(["owner", "editor", "viewer"]),
  validate(updateCommentSchema),
  commentController.updateComment,
);

// DELETE /api/v1/trips/:id/comments/:commentId
router.delete(
  "/:commentId",
  ...auth,
  requireRole(["owner", "editor", "viewer"]),
  commentController.deleteComment,
);

export default router;
