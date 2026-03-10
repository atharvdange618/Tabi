/**
 * notifications.test.ts
 *
 * Comprehensive test suite for the Notification System (Phase 6).
 *
 * Structure:
 *   1. "Notification Service" - direct service-layer tests
 *      - createNotification
 *      - getNotifications (filtering, pagination)
 *      - getUnreadCount
 *      - markAsRead
 *      - markAllAsRead
 *      - deleteNotification
 *
 *   2. "Notification Event System" - event-driven tests
 *      - ownership.transferred → notifications for old owner, new owner, other members
 *      - member.left → notifications for remaining members
 *
 *   3. "Notification API" - HTTP integration tests
 *      - GET    /api/v1/notifications
 *      - GET    /api/v1/notifications/unread-count
 *      - PATCH  /api/v1/notifications/:id/read
 *      - PATCH  /api/v1/notifications/read-all
 *      - DELETE /api/v1/notifications/:id
 *
 * Note: I have used AI to generate these tests based on the requirements and my
 * knowledge of the codebase, but I have personally reviewed and edited each test
 * case to ensure accuracy and relevance.
 */

import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";

// Mock Clerk
vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: (req: any) => ({
    userId: req.headers["x-test-clerk-id"] ?? null,
  }),
}));

// Mock email module
vi.mock("../lib/email.ts", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

import app from "../app.ts";
import { User, TripMember, Notification } from "../models/index.ts";
import * as notificationService from "../services/notification.service.ts";
import * as tripService from "../services/trip.service.ts";
import {
  notificationEvents,
  NotificationEvents,
} from "../lib/notificationEmitter.ts";
import type { NotificationType } from "../../../shared/types/index.ts";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";

// ── Helpers ────────────────────────────────────────────────────────────────

async function createTestUser(
  opts: { clerkId?: string; email?: string; name?: string } = {},
) {
  const uid = new mongoose.Types.ObjectId().toHexString();
  return User.create({
    clerkId: opts.clerkId ?? `clerk_${uid}`,
    email: opts.email ?? `user_${uid}@example.com`,
    name: opts.name ?? "Test User",
    avatarUrl: "",
  });
}

async function seedTrip(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return tripService.createTrip(userId, {
    title: "Test Trip",
    startDate: "2025-09-01T00:00:00.000Z",
    endDate: "2025-09-03T00:00:00.000Z",
    ...overrides,
  } as any);
}

async function createTestNotification(
  userId: string,
  tripId: string,
  overrides: Partial<{
    type: NotificationType;
    actorId: string;
    message: string;
    isRead: boolean;
    metadata: Record<string, unknown>;
  }> = {},
) {
  const actorId =
    overrides.actorId ?? new mongoose.Types.ObjectId().toHexString();
  return Notification.create({
    userId: new mongoose.Types.ObjectId(userId),
    tripId: new mongoose.Types.ObjectId(tripId),
    type: overrides.type ?? "ownership_transferred",
    actorId: new mongoose.Types.ObjectId(actorId),
    message: overrides.message ?? "Test notification",
    metadata: overrides.metadata ?? {},
    isRead: overrides.isRead ?? false,
  });
}

// =============================================================================
// 1. Notification Service - unit / integration tests
// =============================================================================

describe("Notification Service", () => {
  // ── createNotification ───────────────────────────────────────────────────

  describe("createNotification", () => {
    it("creates a notification with all required fields", async () => {
      const user = await createTestUser();
      const actor = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const notification = await notificationService.createNotification(
        user._id.toString(),
        trip._id.toString(),
        "ownership_transferred",
        actor._id.toString(),
        "Test message",
        { key: "value" },
      );

      expect(notification._id).toBeDefined();
      expect(notification.userId.toString()).toBe(user._id.toString());
      expect(notification.tripId.toString()).toBe(trip._id.toString());
      expect(notification.type).toBe("ownership_transferred");
      expect(notification.message).toBe("Test message");
      expect(notification.isRead).toBe(false);
      expect(notification.metadata).toEqual({ key: "value" });
    });

    it("defaults isRead to false", async () => {
      const user = await createTestUser();
      const actor = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const notification = await notificationService.createNotification(
        user._id.toString(),
        trip._id.toString(),
        "member_left",
        actor._id.toString(),
        "Someone left",
      );

      expect(notification.isRead).toBe(false);
    });

    it("defaults metadata to empty object when not provided", async () => {
      const user = await createTestUser();
      const actor = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const notification = await notificationService.createNotification(
        user._id.toString(),
        trip._id.toString(),
        "member_left",
        actor._id.toString(),
        "Test",
      );

      expect(notification.metadata).toEqual({});
    });
  });

  // ── getNotifications ─────────────────────────────────────────────────────

  describe("getNotifications", () => {
    it("returns all notifications for a user sorted by createdAt desc", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        message: "First",
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        message: "Second",
      });

      const notifications = await notificationService.getNotifications(
        user._id.toString(),
      );

      expect(notifications.length).toBeGreaterThanOrEqual(2);
      // Sorted descending by createdAt
      const timestamps = notifications.map(
        (n) => (n as any).createdAt?.getTime?.() ?? 0,
      );
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]!);
      }
    });

    it("filters by isRead=false (unread only)", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: true,
      });

      const notifications = await notificationService.getNotifications(
        user._id.toString(),
        { isRead: false },
      );

      expect(notifications.every((n) => n.isRead === false)).toBe(true);
    });

    it("filters by isRead=true (read only)", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: true,
      });

      const notifications = await notificationService.getNotifications(
        user._id.toString(),
        { isRead: true },
      );

      expect(notifications.every((n) => n.isRead)).toBe(true);
    });

    it("filters by tripId", async () => {
      const user = await createTestUser();
      const trip1 = await seedTrip(user._id.toString());
      const trip2 = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip1._id.toString());
      await createTestNotification(user._id.toString(), trip2._id.toString());

      const notifications = await notificationService.getNotifications(
        user._id.toString(),
        { tripId: trip1._id.toString() },
      );

      expect(
        notifications.every((n) => {
          const tripId = (n.tripId as any)._id ?? n.tripId;
          return tripId.toString() === trip1._id.toString();
        }),
      ).toBe(true);
    });

    it("respects limit and skip for pagination", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      // Create 5 notifications
      for (let i = 0; i < 5; i++) {
        await createTestNotification(user._id.toString(), trip._id.toString(), {
          message: `Notification ${i}`,
        });
      }

      const page1 = await notificationService.getNotifications(
        user._id.toString(),
        { limit: 2, skip: 0 },
      );
      const page2 = await notificationService.getNotifications(
        user._id.toString(),
        { limit: 2, skip: 2 },
      );

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      // Pages should be different
      expect(page1[0]!._id.toString()).not.toBe(page2[0]!._id.toString());
    });

    it("does not return notifications belonging to other users", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const trip = await seedTrip(user1._id.toString());

      await createTestNotification(user1._id.toString(), trip._id.toString(), {
        message: "For user1",
      });
      await createTestNotification(user2._id.toString(), trip._id.toString(), {
        message: "For user2",
      });

      const notifications = await notificationService.getNotifications(
        user1._id.toString(),
      );

      expect(
        notifications.every((n) => {
          const userId = (n.userId as any)._id ?? n.userId;
          return userId.toString() === user1._id.toString();
        }),
      ).toBe(true);
    });

    it("returns empty array when user has no notifications", async () => {
      const user = await createTestUser();
      const notifications = await notificationService.getNotifications(
        user._id.toString(),
      );
      expect(notifications).toEqual([]);
    });

    it("populates actorId with name and avatarUrl", async () => {
      const user = await createTestUser();
      const actor = await createTestUser({ name: "Actor User" });
      const trip = await seedTrip(user._id.toString());

      await notificationService.createNotification(
        user._id.toString(),
        trip._id.toString(),
        "member_left",
        actor._id.toString(),
        "Actor User left",
      );

      const notifications = await notificationService.getNotifications(
        user._id.toString(),
      );

      const populated = notifications[0]!.actorId as any;
      expect(populated.name).toBe("Actor User");
    });

    it("populates tripId with title", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString(), { title: "My Journey" });

      await createTestNotification(user._id.toString(), trip._id.toString());

      const notifications = await notificationService.getNotifications(
        user._id.toString(),
      );

      const populatedTrip = notifications[0]!.tripId as any;
      expect(populatedTrip.title).toBe("My Journey");
    });
  });

  // ── getUnreadCount ───────────────────────────────────────────────────────

  describe("getUnreadCount", () => {
    it("returns count of unread notifications for user", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: true,
      });

      const count = await notificationService.getUnreadCount(
        user._id.toString(),
      );

      expect(count).toBe(2);
    });

    it("returns 0 when user has no unread notifications", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: true,
      });

      const count = await notificationService.getUnreadCount(
        user._id.toString(),
      );
      expect(count).toBe(0);
    });

    it("returns 0 for user with no notifications", async () => {
      const user = await createTestUser();
      const count = await notificationService.getUnreadCount(
        user._id.toString(),
      );
      expect(count).toBe(0);
    });

    it("does not count unread notifications from other users", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const trip = await seedTrip(user1._id.toString());

      await createTestNotification(user2._id.toString(), trip._id.toString(), {
        isRead: false,
      });

      const count = await notificationService.getUnreadCount(
        user1._id.toString(),
      );
      expect(count).toBe(0);
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────────────

  describe("markAsRead", () => {
    it("marks an unread notification as read and returns it", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());
      const notif = await createTestNotification(
        user._id.toString(),
        trip._id.toString(),
        { isRead: false },
      );

      const updated = await notificationService.markAsRead(
        notif._id.toString(),
        user._id.toString(),
      );

      expect(updated).not.toBeNull();
      expect(updated!.isRead).toBe(true);
    });

    it("throws NotFoundError when notification does not exist", async () => {
      const user = await createTestUser();
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        notificationService.markAsRead(fakeId, user._id.toString()),
      ).rejects.toThrow("Notification not found");
    });

    it("throws NotFoundError when notification belongs to another user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const trip = await seedTrip(user1._id.toString());
      const notif = await createTestNotification(
        user1._id.toString(),
        trip._id.toString(),
      );

      await expect(
        notificationService.markAsRead(
          notif._id.toString(),
          user2._id.toString(),
        ),
      ).rejects.toThrow("Notification not found");
    });
  });

  // ── markAllAsRead ─────────────────────────────────────────────────────────

  describe("markAllAsRead", () => {
    it("marks all unread notifications as read for a user", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });

      await notificationService.markAllAsRead(user._id.toString());

      const unreadCount = await notificationService.getUnreadCount(
        user._id.toString(),
      );
      expect(unreadCount).toBe(0);
    });

    it("marks only trip-specific notifications as read when tripId provided", async () => {
      const user = await createTestUser();
      const trip1 = await seedTrip(user._id.toString());
      const trip2 = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip1._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip2._id.toString(), {
        isRead: false,
      });

      await notificationService.markAllAsRead(
        user._id.toString(),
        trip1._id.toString(),
      );

      const allNotifs = await notificationService.getNotifications(
        user._id.toString(),
      );
      const trip1Notifs = allNotifs.filter(
        (n) => n.tripId.toString() === trip1._id.toString(),
      );
      const trip2Notifs = allNotifs.filter(
        (n) => n.tripId.toString() === trip2._id.toString(),
      );

      expect(trip1Notifs.every((n) => n.isRead)).toBe(true);
      expect(trip2Notifs.every((n) => !n.isRead)).toBe(true);
    });

    it("does not affect notifications of other users", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const trip = await seedTrip(user1._id.toString());

      await createTestNotification(user2._id.toString(), trip._id.toString(), {
        isRead: false,
      });

      await notificationService.markAllAsRead(user1._id.toString());

      const count = await notificationService.getUnreadCount(
        user2._id.toString(),
      );
      expect(count).toBe(1);
    });
  });

  // ── deleteNotification ────────────────────────────────────────────────────

  describe("deleteNotification", () => {
    it("deletes a notification owned by the user", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());
      const notif = await createTestNotification(
        user._id.toString(),
        trip._id.toString(),
      );

      await notificationService.deleteNotification(
        notif._id.toString(),
        user._id.toString(),
      );

      const found = await Notification.findById(notif._id);
      expect(found).toBeNull();
    });

    it("throws NotFoundError when notification does not exist", async () => {
      const user = await createTestUser();
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        notificationService.deleteNotification(fakeId, user._id.toString()),
      ).rejects.toThrow("Notification not found");
    });

    it("throws NotFoundError when notification belongs to another user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const trip = await seedTrip(user1._id.toString());
      const notif = await createTestNotification(
        user1._id.toString(),
        trip._id.toString(),
      );

      await expect(
        notificationService.deleteNotification(
          notif._id.toString(),
          user2._id.toString(),
        ),
      ).rejects.toThrow("Notification not found");

      // Ensure it was not deleted
      const found = await Notification.findById(notif._id);
      expect(found).not.toBeNull();
    });
  });
});

// =============================================================================
// 2. Notification Event System
// =============================================================================

describe("Notification Event System", () => {
  // ── ownership.transferred ────────────────────────────────────────────────

  describe("ownership.transferred event", () => {
    it("creates notifications for old owner, new owner, and other members", async () => {
      const oldOwner = await createTestUser({ name: "Old Owner" });
      const newOwner = await createTestUser({ name: "New Owner" });
      const editor = await createTestUser({ name: "Editor" });
      const trip = await seedTrip(oldOwner._id.toString(), {
        title: "Event Trip",
      });

      // Add new owner and editor as active members
      await TripMember.insertMany([
        {
          tripId: trip._id,
          userId: newOwner._id,
          role: TripMemberRole.EDITOR,
          status: TripMemberStatus.ACTIVE,
          invitedBy: oldOwner._id,
          joinedAt: new Date(),
        },
        {
          tripId: trip._id,
          userId: editor._id,
          role: TripMemberRole.EDITOR,
          status: TripMemberStatus.ACTIVE,
          invitedBy: oldOwner._id,
          joinedAt: new Date(),
        },
      ]);

      // Emit the event and wait briefly for async handler
      notificationEvents.emit(NotificationEvents.OWNERSHIP_TRANSFERRED, {
        tripId: trip._id.toString(),
        tripTitle: "Event Trip",
        oldOwnerId: oldOwner._id.toString(),
        newOwnerId: newOwner._id.toString(),
        actorId: oldOwner._id.toString(),
      });

      // Wait for async event handler to finish
      await new Promise((resolve) => setTimeout(resolve, 200));

      const oldOwnerNotifs = await notificationService.getNotifications(
        oldOwner._id.toString(),
      );
      const newOwnerNotifs = await notificationService.getNotifications(
        newOwner._id.toString(),
      );
      const editorNotifs = await notificationService.getNotifications(
        editor._id.toString(),
      );

      expect(oldOwnerNotifs.length).toBeGreaterThanOrEqual(1);
      expect(newOwnerNotifs.length).toBeGreaterThanOrEqual(1);
      expect(editorNotifs.length).toBeGreaterThanOrEqual(1);

      expect(oldOwnerNotifs[0]!.type).toBe("ownership_transferred");
      expect(newOwnerNotifs[0]!.type).toBe("ownership_transferred");
      expect(editorNotifs[0]!.type).toBe("ownership_transferred");
    });

    it("creates notification with correct message for old owner", async () => {
      const oldOwner = await createTestUser({ name: "Alice" });
      const newOwner = await createTestUser({ name: "Bob" });
      const trip = await seedTrip(oldOwner._id.toString(), {
        title: "Transfer Trip",
      });

      await TripMember.create({
        tripId: trip._id,
        userId: newOwner._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: oldOwner._id,
        joinedAt: new Date(),
      });

      notificationEvents.emit(NotificationEvents.OWNERSHIP_TRANSFERRED, {
        tripId: trip._id.toString(),
        tripTitle: "Transfer Trip",
        oldOwnerId: oldOwner._id.toString(),
        newOwnerId: newOwner._id.toString(),
        actorId: oldOwner._id.toString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const oldOwnerNotifs = await notificationService.getNotifications(
        oldOwner._id.toString(),
      );
      expect(oldOwnerNotifs[0]!.message).toContain("editor");
    });

    it("creates notification with correct message for new owner", async () => {
      const oldOwner = await createTestUser({ name: "Alice" });
      const newOwner = await createTestUser({ name: "Bob" });
      const trip = await seedTrip(oldOwner._id.toString(), {
        title: "Transfer Trip",
      });

      await TripMember.create({
        tripId: trip._id,
        userId: newOwner._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: oldOwner._id,
        joinedAt: new Date(),
      });

      notificationEvents.emit(NotificationEvents.OWNERSHIP_TRANSFERRED, {
        tripId: trip._id.toString(),
        tripTitle: "Transfer Trip",
        oldOwnerId: oldOwner._id.toString(),
        newOwnerId: newOwner._id.toString(),
        actorId: oldOwner._id.toString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const newOwnerNotifs = await notificationService.getNotifications(
        newOwner._id.toString(),
      );
      expect(newOwnerNotifs[0]!.message).toContain("owner");
    });

    it("stores oldOwnerId and newOwnerId in notification metadata", async () => {
      const oldOwner = await createTestUser();
      const newOwner = await createTestUser();
      const trip = await seedTrip(oldOwner._id.toString(), {
        title: "Meta Trip",
      });

      await TripMember.create({
        tripId: trip._id,
        userId: newOwner._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: oldOwner._id,
        joinedAt: new Date(),
      });

      notificationEvents.emit(NotificationEvents.OWNERSHIP_TRANSFERRED, {
        tripId: trip._id.toString(),
        tripTitle: "Meta Trip",
        oldOwnerId: oldOwner._id.toString(),
        newOwnerId: newOwner._id.toString(),
        actorId: oldOwner._id.toString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const notifs = await Notification.find({
        tripId: trip._id,
        type: "ownership_transferred",
      }).lean();

      expect(notifs.length).toBeGreaterThanOrEqual(1);
      const meta = notifs[0]!.metadata as Record<string, unknown>;
      expect(meta.oldOwnerId).toBe(oldOwner._id.toString());
      expect(meta.newOwnerId).toBe(newOwner._id.toString());
    });
  });

  // ── member.left event ────────────────────────────────────────────────────

  describe("member.left event", () => {
    it("creates notifications for all remaining trip members", async () => {
      const owner = await createTestUser({ name: "Owner" });
      const editor = await createTestUser({ name: "Editor" });
      const leavingUser = await createTestUser({ name: "Leaver" });
      const trip = await seedTrip(owner._id.toString(), {
        title: "Leave Trip",
      });

      // Add editor and leavingUser as active members
      await TripMember.insertMany([
        {
          tripId: trip._id,
          userId: editor._id,
          role: TripMemberRole.EDITOR,
          status: TripMemberStatus.ACTIVE,
          invitedBy: owner._id,
          joinedAt: new Date(),
        },
        {
          tripId: trip._id,
          userId: leavingUser._id,
          role: TripMemberRole.EDITOR,
          status: TripMemberStatus.ACTIVE,
          invitedBy: owner._id,
          joinedAt: new Date(),
        },
      ]);

      // Simulate user left (member already removed before event)
      await TripMember.deleteOne({ tripId: trip._id, userId: leavingUser._id });

      notificationEvents.emit(NotificationEvents.MEMBER_LEFT, {
        tripId: trip._id.toString(),
        tripTitle: "Leave Trip",
        userId: leavingUser._id.toString(),
        userName: "Leaver",
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const ownerNotifs = await notificationService.getNotifications(
        owner._id.toString(),
      );
      const editorNotifs = await notificationService.getNotifications(
        editor._id.toString(),
      );

      expect(ownerNotifs.length).toBeGreaterThanOrEqual(1);
      expect(editorNotifs.length).toBeGreaterThanOrEqual(1);
      expect(ownerNotifs[0]!.type).toBe("member_left");
      expect(editorNotifs[0]!.type).toBe("member_left");
    });

    it("includes leaving user's name in the notification message", async () => {
      const owner = await createTestUser({ name: "Owner" });
      const leavingUser = await createTestUser({ name: "John Doe" });
      const trip = await seedTrip(owner._id.toString(), {
        title: "Departure Trip",
      });

      await TripMember.create({
        tripId: trip._id,
        userId: leavingUser._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await TripMember.deleteOne({ tripId: trip._id, userId: leavingUser._id });

      notificationEvents.emit(NotificationEvents.MEMBER_LEFT, {
        tripId: trip._id.toString(),
        tripTitle: "Departure Trip",
        userId: leavingUser._id.toString(),
        userName: "John Doe",
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const ownerNotifs = await notificationService.getNotifications(
        owner._id.toString(),
      );
      expect(ownerNotifs[0]!.message).toContain("John Doe");
    });

    it("does not create notification for the user who left", async () => {
      const owner = await createTestUser({ name: "Owner" });
      const leavingUser = await createTestUser({ name: "Leaver" });
      const trip = await seedTrip(owner._id.toString(), {
        title: "Solo Trip",
      });

      await TripMember.create({
        tripId: trip._id,
        userId: leavingUser._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      // Remove leavingUser before emitting
      await TripMember.deleteOne({ tripId: trip._id, userId: leavingUser._id });

      notificationEvents.emit(NotificationEvents.MEMBER_LEFT, {
        tripId: trip._id.toString(),
        tripTitle: "Solo Trip",
        userId: leavingUser._id.toString(),
        userName: "Leaver",
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // leavingUser should receive 0 notifications (they are not in the members list)
      const leavingUserNotifs = await notificationService.getNotifications(
        leavingUser._id.toString(),
      );
      expect(leavingUserNotifs).toHaveLength(0);
    });

    it("stores leaving userId and userName in notification metadata", async () => {
      const owner = await createTestUser({ name: "Owner" });
      const leavingUser = await createTestUser({ name: "Jane" });
      const trip = await seedTrip(owner._id.toString(), {
        title: "Meta Trip",
      });

      await TripMember.create({
        tripId: trip._id,
        userId: leavingUser._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await TripMember.deleteOne({ tripId: trip._id, userId: leavingUser._id });

      notificationEvents.emit(NotificationEvents.MEMBER_LEFT, {
        tripId: trip._id.toString(),
        tripTitle: "Meta Trip",
        userId: leavingUser._id.toString(),
        userName: "Jane",
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const notifs = await Notification.find({
        tripId: trip._id,
        type: "member_left",
      }).lean();

      expect(notifs.length).toBeGreaterThanOrEqual(1);
      const meta = notifs[0]!.metadata as Record<string, unknown>;
      expect(meta.leftUserId).toBe(leavingUser._id.toString());
      expect(meta.userName).toBe("Jane");
    });
  });
});

// =============================================================================
// 3. Notification API - HTTP integration tests
// =============================================================================

describe("Notification API", () => {
  // ── GET /api/v1/notifications ────────────────────────────────────────────

  describe("GET /api/v1/notifications", () => {
    it("returns 200 with notifications for authenticated user", async () => {
      const user = await createTestUser({ clerkId: "clerk_notif_get_1" });
      const trip = await seedTrip(user._id.toString());
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        message: "API Test Notification",
      });

      const res = await request(app)
        .get("/api/v1/notifications")
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 401 without authentication", async () => {
      await request(app).get("/api/v1/notifications").expect(401);
    });

    it("filters by isRead=false via query param", async () => {
      const user = await createTestUser({ clerkId: "clerk_notif_filter_1" });
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: true,
      });

      const res = await request(app)
        .get("/api/v1/notifications?isRead=false")
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(res.body.data.every((n: any) => n.isRead === false)).toBe(true);
    });

    it("filters by tripId via query param", async () => {
      const user = await createTestUser({ clerkId: "clerk_notif_trip_1" });
      const trip1 = await seedTrip(user._id.toString());
      const trip2 = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip1._id.toString());
      await createTestNotification(user._id.toString(), trip2._id.toString());

      const res = await request(app)
        .get(`/api/v1/notifications?tripId=${trip1._id}`)
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(
        res.body.data.every(
          (n: any) =>
            n.tripId._id === trip1._id.toString() ||
            n.tripId === trip1._id.toString(),
        ),
      ).toBe(true);
    });

    it("returns empty array when user has no notifications", async () => {
      const user = await createTestUser({ clerkId: "clerk_notif_empty_1" });

      const res = await request(app)
        .get("/api/v1/notifications")
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  // ── GET /api/v1/notifications/unread-count ───────────────────────────────

  describe("GET /api/v1/notifications/unread-count", () => {
    it("returns 200 with unread count", async () => {
      const user = await createTestUser({ clerkId: "clerk_unread_1" });
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: true,
      });

      const res = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(res.body.data.count).toBe(2);
    });

    it("returns 0 when user has no unread notifications", async () => {
      const user = await createTestUser({ clerkId: "clerk_unread_zero" });

      const res = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(res.body.data.count).toBe(0);
    });

    it("returns 401 without authentication", async () => {
      await request(app).get("/api/v1/notifications/unread-count").expect(401);
    });
  });

  // ── PATCH /api/v1/notifications/:id/read ───────────────────────────────

  describe("PATCH /api/v1/notifications/:id/read", () => {
    it("returns 200 and marks notification as read", async () => {
      const user = await createTestUser({ clerkId: "clerk_mark_read_1" });
      const trip = await seedTrip(user._id.toString());
      const notif = await createTestNotification(
        user._id.toString(),
        trip._id.toString(),
        { isRead: false },
      );

      const res = await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(res.body.data.isRead).toBe(true);
    });

    it("returns 404 when notification does not belong to user", async () => {
      const user1 = await createTestUser({ clerkId: "clerk_mark_read_2" });
      const user2 = await createTestUser({ clerkId: "clerk_mark_read_3" });
      const trip = await seedTrip(user1._id.toString());
      const notif = await createTestNotification(
        user1._id.toString(),
        trip._id.toString(),
      );

      await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set("x-test-clerk-id", user2.clerkId)
        .expect(404);
    });

    it("returns 401 without authentication", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .patch(`/api/v1/notifications/${fakeId}/read`)
        .expect(401);
    });
  });

  // ── PATCH /api/v1/notifications/read-all ────────────────────────────────

  describe("PATCH /api/v1/notifications/read-all", () => {
    it("returns 200 and marks all notifications as read", async () => {
      const user = await createTestUser({ clerkId: "clerk_read_all_1" });
      const trip = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip._id.toString(), {
        isRead: false,
      });

      await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      const countRes = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("x-test-clerk-id", user.clerkId);

      expect(countRes.body.data.count).toBe(0);
    });

    it("marks only trip notifications as read when tripId provided", async () => {
      const user = await createTestUser({ clerkId: "clerk_read_all_2" });
      const trip1 = await seedTrip(user._id.toString());
      const trip2 = await seedTrip(user._id.toString());

      await createTestNotification(user._id.toString(), trip1._id.toString(), {
        isRead: false,
      });
      await createTestNotification(user._id.toString(), trip2._id.toString(), {
        isRead: false,
      });

      await request(app)
        .patch(`/api/v1/notifications/read-all?tripId=${trip1._id}`)
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      const countRes = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("x-test-clerk-id", user.clerkId);

      // trip2 notification still unread
      expect(countRes.body.data.count).toBe(1);
    });

    it("returns 401 without authentication", async () => {
      await request(app).patch("/api/v1/notifications/read-all").expect(401);
    });
  });

  // ── DELETE /api/v1/notifications/:id ────────────────────────────────────

  describe("DELETE /api/v1/notifications/:id", () => {
    it("returns 200 and deletes the notification", async () => {
      const user = await createTestUser({ clerkId: "clerk_delete_notif_1" });
      const trip = await seedTrip(user._id.toString());
      const notif = await createTestNotification(
        user._id.toString(),
        trip._id.toString(),
      );

      await request(app)
        .delete(`/api/v1/notifications/${notif._id}`)
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      const found = await Notification.findById(notif._id);
      expect(found).toBeNull();
    });

    it("returns 404 when notification does not belong to user", async () => {
      const user1 = await createTestUser({ clerkId: "clerk_delete_notif_2" });
      const user2 = await createTestUser({ clerkId: "clerk_delete_notif_3" });
      const trip = await seedTrip(user1._id.toString());
      const notif = await createTestNotification(
        user1._id.toString(),
        trip._id.toString(),
      );

      await request(app)
        .delete(`/api/v1/notifications/${notif._id}`)
        .set("x-test-clerk-id", user2.clerkId)
        .expect(404);

      // Ensure notification was not deleted
      const found = await Notification.findById(notif._id);
      expect(found).not.toBeNull();
    });

    it("returns 401 without authentication", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app).delete(`/api/v1/notifications/${fakeId}`).expect(401);
    });
  });
});
