import type { Request, Response } from "express";
import * as notificationService from "../services/notification.service.ts";

/**
 * GET /api/v1/notifications?isRead=true|false&tripId=<id>&limit=50&skip=0
 * Get notifications for the current user with optional filters
 */
export async function getNotifications(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const { isRead, tripId, limit, skip } = req.query;

  const options: notificationService.GetNotificationsOptions = {};

  if (isRead !== undefined) {
    options.isRead = isRead === "true";
  }

  if (tripId && typeof tripId === "string") {
    options.tripId = tripId;
  }

  if (limit && typeof limit === "string") {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
      options.limit = parsedLimit;
    }
  }

  if (skip && typeof skip === "string") {
    const parsedSkip = parseInt(skip, 10);
    if (!isNaN(parsedSkip) && parsedSkip >= 0) {
      options.skip = parsedSkip;
    }
  }

  const notifications = await notificationService.getNotifications(
    userId,
    options,
  );

  res.json({ data: notifications });
}

/**
 * GET /api/v1/notifications/unread-count
 * Get the count of unread notifications for the current user
 */
export async function getUnreadCount(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const count = await notificationService.getUnreadCount(userId);

  res.json({ data: { count } });
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }

  const notification = await notificationService.markAsRead(id, userId);

  res.json({ data: notification });
}

/**
 * PATCH /api/v1/notifications/read-all?tripId=<id>
 * Mark all notifications as read (optionally filtered by trip)
 */
export async function markAllAsRead(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const { tripId } = req.query;

  await notificationService.markAllAsRead(
    userId,
    tripId && typeof tripId === "string" ? tripId : undefined,
  );

  res.json({ message: "All notifications marked as read" });
}

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }

  await notificationService.deleteNotification(id, userId);

  res.json({ message: "Notification deleted" });
}
