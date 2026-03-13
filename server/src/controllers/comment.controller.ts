import type { Request, Response } from "express";
import * as commentService from "../services/comment.service.ts";
import { Comment } from "../models/Comment.ts";
import type {
  CreateCommentPayload,
  UpdateCommentPayload,
  ToggleCommentReactionPayload,
} from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/comments?targetType=day|activity&targetId=<id>
 * Retrieve all comments for a specific target (Day or Activity).
 */
export async function getComments(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { targetType, targetId } = req.query;

  if (!targetType || !targetId) {
    res.status(400).json({
      error: "targetType and targetId are required query parameters",
    });
    return;
  }

  if (targetType !== "day" && targetType !== "activity") {
    res.status(400).json({ error: "targetType must be 'day' or 'activity'" });
    return;
  }

  const comments = await commentService.getComments(
    id as string,
    targetType,
    targetId as string,
  );
  res.json({ data: comments });
}

/**
 * POST /api/v1/trips/:id/comments
 * Create a new comment on a Day or Activity.
 */
export async function createComment(
  req: Request,
  res: Response,
): Promise<void> {
  const authorId = req.dbUserId;
  if (!authorId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const comment = await commentService.createComment(
    req.params.id as string,
    authorId,
    req.body as CreateCommentPayload,
  );
  res.status(201).json({ data: comment });
}

/**
 * PATCH /api/v1/trips/:id/comments/:commentId
 * Update a comment. Only the original author can update.
 */
export async function updateComment(
  req: Request,
  res: Response,
): Promise<void> {
  const authorId = req.dbUserId;
  if (!authorId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const comment = await commentService.updateComment(
    req.params.commentId as string,
    authorId,
    req.body as UpdateCommentPayload,
  );
  res.json({ data: comment });
}

/**
 * DELETE /api/v1/trips/:id/comments/:commentId
 * Delete a comment. Author, trip owner, or editor can delete.
 */
export async function deleteComment(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  const memberRole = req.member?.role;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  if (
    comment.authorId.toString() !== userId &&
    memberRole !== "owner" &&
    memberRole !== "editor"
  ) {
    res
      .status(403)
      .json({ error: "You don't have permission to delete this comment" });
    return;
  }

  await commentService.deleteComment(commentId as string);
  res.json({ message: "Comment deleted successfully" });
}

/**
 * POST /api/v1/trips/:id/comments/:commentId/reactions
 * Toggle an emoji reaction on a comment. Any trip member can react.
 */
export async function toggleReaction(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const { commentId } = req.params;
  if (!commentId || typeof commentId !== "string") {
    res.status(400).json({ error: "commentId is required" });
    return;
  }
  const { emoji } = req.body as ToggleCommentReactionPayload;

  const comment = await commentService.toggleReaction(commentId, userId, emoji);
  res.json({ data: comment });
}
