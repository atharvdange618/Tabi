import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.ts";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";

const router = Router();

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/notifications - List notifications with optional filters
router.get("/", ...auth, notificationController.getNotifications);

// GET /api/v1/notifications/unread-count - Get unread count
router.get("/unread-count", ...auth, notificationController.getUnreadCount);

// PATCH /api/v1/notifications/:id/read - Mark single notification as read
router.patch("/:id/read", ...auth, notificationController.markAsRead);

// PATCH /api/v1/notifications/read-all - Mark all notifications as read
router.patch("/read-all", ...auth, notificationController.markAllAsRead);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete("/:id", ...auth, notificationController.deleteNotification);

export default router;
