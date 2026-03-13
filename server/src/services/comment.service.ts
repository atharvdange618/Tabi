import { Comment, Trip } from "../models/index.ts";
import { LimitExceededError, NotFoundError } from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
import {
  notificationEvents,
  NotificationEvents,
} from "../lib/notificationEmitter.ts";
import type {
  CreateCommentPayload,
  UpdateCommentPayload,
} from "../../../shared/validations/index.ts";
import logger from "../lib/logger.ts";

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

  try {
    const trip = await Trip.findById(tripId).lean();
    if (trip) {
      notificationEvents.emit(NotificationEvents.COMMENT_CREATED, {
        tripId,
        tripTitle: trip.title,
        commentId: comment._id.toString(),
        authorId,
        targetType: data.targetType,
        targetId: data.targetId,
      });
    }
  } catch (error) {
    logger.error("Failed to emit comment created event", {
      error,
      commentId: comment._id,
    });
  }

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

/**
 * Toggle an emoji reaction on a comment.
 * Adds the reaction if not present, removes if already reacted.
 * Enforces max 6 distinct emoji types per comment.
 */
export async function toggleReaction(
  commentId: string,
  userId: string,
  emoji: string,
) {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new NotFoundError("Comment not found");
  }

  const reactions = comment.reactions as unknown as {
    emoji: string;
    users: string[];
  }[];
  const existing = reactions.find((r) => r.emoji === emoji);

  if (existing) {
    const idx = existing.users.findIndex((u) => u === userId);
    if (idx !== -1) {
      existing.users.splice(idx, 1);
      if (existing.users.length === 0) {
        comment.set(
          "reactions",
          reactions.filter((r) => r.emoji !== emoji),
        );
      }
    } else {
      existing.users.push(userId as unknown as string);
    }
  } else {
    if (reactions.length >= 6) {
      throw new LimitExceededError(
        "A comment can have at most 6 different reaction types",
      );
    }
    reactions.push({ emoji, users: [userId] });
    comment.set("reactions", reactions);
  }

  await comment.save();
  await comment.populate("authorId", "name avatarUrl");
  return comment;
}
