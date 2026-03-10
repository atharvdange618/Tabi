import mongoose from "mongoose";
import { Notification, TripMember } from "../models/index.ts";
import { NotFoundError } from "../lib/errors.ts";
import {
  notificationEvents,
  NotificationEvents,
  type OwnershipTransferredPayload,
  type MemberLeftPayload,
} from "../lib/notificationEmitter.ts";
import type { NotificationType } from "../../../shared/types/index.ts";
import logger from "../lib/logger.ts";

/**
 * Options for querying notifications
 */
export interface GetNotificationsOptions {
  isRead?: boolean;
  tripId?: string;
  limit?: number;
  skip?: number;
}

/**
 * Core function to create a notification record
 */
export async function createNotification(
  userId: string,
  tripId: string,
  type: NotificationType,
  actorId: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(userId),
      tripId: new mongoose.Types.ObjectId(tripId),
      type,
      actorId: new mongoose.Types.ObjectId(actorId),
      message,
      metadata,
      isRead: false,
    });

    return notification;
  } catch (error) {
    logger.error("Failed to create notification", {
      error,
      userId,
      tripId,
      type,
    });
    throw error;
  }
}

/**
 * Bulk create notifications for multiple users
 */
async function bulkCreateNotifications(
  notifications: {
    userId: string;
    tripId: string;
    type: NotificationType;
    actorId: string;
    message: string;
    metadata?: Record<string, unknown>;
  }[],
) {
  try {
    const docs = notifications.map((n) => ({
      userId: new mongoose.Types.ObjectId(n.userId),
      tripId: new mongoose.Types.ObjectId(n.tripId),
      type: n.type,
      actorId: new mongoose.Types.ObjectId(n.actorId),
      message: n.message,
      metadata: n.metadata ?? {},
      isRead: false,
    }));

    await Notification.insertMany(docs);
  } catch (error) {
    logger.error("Failed to bulk create notifications", {
      error,
      count: notifications.length,
    });
    throw error;
  }
}

/**
 * Get notifications for a user with optional filters
 */
export async function getNotifications(
  userId: string,
  options: GetNotificationsOptions = {},
) {
  const { isRead, tripId, limit = 50, skip = 0 } = options;

  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (isRead !== undefined) {
    query.isRead = isRead;
  }

  if (tripId) {
    query.tripId = new mongoose.Types.ObjectId(tripId);
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name email avatarUrl")
    .populate("actorId", "name avatarUrl")
    .populate("tripId", "title")
    .lean();

  return notifications;
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const count = await Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });

  return count;
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: { isRead: true } },
    { new: true },
  )
    .populate("userId", "name email avatarUrl")
    .populate("actorId", "name avatarUrl")
    .populate("tripId", "title")
    .lean();

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  return notification;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  userId: string,
  tripId?: string,
): Promise<void> {
  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  };

  if (tripId) {
    query.tripId = new mongoose.Types.ObjectId(tripId);
  }

  await Notification.updateMany(query, { $set: { isRead: true } });
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<void> {
  const result = await Notification.deleteOne({
    _id: new mongoose.Types.ObjectId(notificationId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw new NotFoundError("Notification not found");
  }
}

/**
 * Event handler: Ownership transferred
 * Creates notifications for old owner, new owner, and all other trip members
 */
async function handleOwnershipTransferred(
  payload: OwnershipTransferredPayload,
) {
  try {
    const { tripId, tripTitle, oldOwnerId, newOwnerId, actorId } = payload;

    const members = await TripMember.find({
      tripId: new mongoose.Types.ObjectId(tripId),
      status: "active",
    }).lean();

    const notifications = [];

    notifications.push({
      userId: oldOwnerId,
      tripId,
      type: "ownership_transferred" as NotificationType,
      actorId,
      message: `You transferred ownership of "${tripTitle}" and are now an editor`,
      metadata: { oldOwnerId, newOwnerId },
    });

    notifications.push({
      userId: newOwnerId,
      tripId,
      type: "ownership_transferred" as NotificationType,
      actorId,
      message: `You are now the owner of "${tripTitle}"`,
      metadata: { oldOwnerId, newOwnerId },
    });

    const otherMembers = members.filter(
      (m) =>
        m.userId.toString() !== oldOwnerId &&
        m.userId.toString() !== newOwnerId,
    );

    for (const member of otherMembers) {
      notifications.push({
        userId: member.userId.toString(),
        tripId,
        type: "ownership_transferred" as NotificationType,
        actorId,
        message: `Ownership of "${tripTitle}" was transferred`,
        metadata: { oldOwnerId, newOwnerId },
      });
    }

    await bulkCreateNotifications(notifications);
    logger.info("Ownership transfer notifications created", {
      tripId,
      count: notifications.length,
    });
  } catch (error) {
    logger.error("Failed to handle ownership transferred event", {
      error,
      payload,
    });
  }
}

/**
 * Event handler: Member left trip
 * Creates notifications for all remaining trip members
 */
async function handleMemberLeft(payload: MemberLeftPayload) {
  try {
    const { tripId, tripTitle, userId, userName } = payload;

    const members = await TripMember.find({
      tripId: new mongoose.Types.ObjectId(tripId),
      status: "active",
    }).lean();

    const notifications = members.map((member) => ({
      userId: member.userId.toString(),
      tripId,
      type: "member_left" as NotificationType,
      actorId: userId,
      message: `${userName} left "${tripTitle}"`,
      metadata: { leftUserId: userId, userName },
    }));

    if (notifications.length > 0) {
      await bulkCreateNotifications(notifications);
      logger.info("Member left notifications created", {
        tripId,
        count: notifications.length,
      });
    }
  } catch (error) {
    logger.error("Failed to handle member left event", { error, payload });
  }
}

/**
 * Register all event listeners.
 */
export function registerNotificationEventListeners() {
  notificationEvents.on(
    NotificationEvents.OWNERSHIP_TRANSFERRED,
    handleOwnershipTransferred,
  );

  notificationEvents.on(NotificationEvents.MEMBER_LEFT, handleMemberLeft);

  logger.info("Notification event listeners registered");
}
