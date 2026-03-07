import { Comment } from "../models/Comment.ts";
import { LimitExceededError, NotFoundError } from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
import type {
  CreateCommentPayload,
  UpdateCommentPayload,
} from "../../../shared/validations/index.ts";

/**
 * Get comments for a specific target (Day or Activity) inside a trip.
 */
export async function getComments(
  tripId: string,
  targetType: "day" | "activity",
  targetId: string,
) {
  return Comment.find({ tripId, targetType, targetId })
    .sort({ createdAt: 1 })
    .populate("authorId", "name avatarUrl")
    .exec();
}

/**
 * Create a new comment.
 */
export async function createComment(
  tripId: string,
  authorId: string,
  data: CreateCommentPayload,
) {
  const commentCount = await Comment.countDocuments({
    tripId,
    targetId: data.targetId,
  });
  if (commentCount >= LIMITS.COMMENTS_PER_TARGET) {
    throw new LimitExceededError(
      `A target can have at most ${LIMITS.COMMENTS_PER_TARGET} comments (${commentCount}/${LIMITS.COMMENTS_PER_TARGET})`,
    );
  }

  const comment = new Comment({
    tripId,
    authorId,
    targetType: data.targetType,
    targetId: data.targetId,
    body: data.body,
    parentId: data.parentId ?? null,
  });

  await comment.save();
  await comment.populate("authorId", "name avatarUrl");
  return comment;
}

/**
 * Update a comment by its ID. Only the author can update.
 */
export async function updateComment(
  commentId: string,
  authorId: string,
  data: UpdateCommentPayload,
) {
  const comment = await Comment.findOneAndUpdate(
    { _id: commentId, authorId },
    { $set: { body: data.body, isEdited: true } },
    { new: true },
  ).populate("authorId", "name avatarUrl");

  if (!comment) {
    throw new NotFoundError("Comment not found or you are not the author");
  }

  return comment;
}

/**
 * Delete a comment by its ID.
 * Permission checks (author vs owner/editor) are handled in the controller.
 */
export async function deleteComment(commentId: string) {
  const result = await Comment.deleteOne({ _id: commentId });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Comment not found");
  }

  await Comment.deleteMany({ parentId: commentId });
}
