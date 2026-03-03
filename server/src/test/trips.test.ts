/**
 * trips.test.ts
 *
 * Comprehensive test suite for the Trip CRUD feature.
 *
 * Structure:
 *   1. "Trip Service" - direct service-layer tests
 *      - createTrip  (Day auto-generation, owner TripMember seeding)
 *      - getUserTrips
 *      - getTripById
 *      - updateTrip  (field updates + date-range reconciliation)
 *      - deleteTripCascade (every child collection verified)
 *
 *   2. "Trip API" - HTTP integration tests
 *      - POST   /api/v1/trips
 *      - GET    /api/v1/trips
 *      - GET    /api/v1/trips/:id
 *      - PATCH  /api/v1/trips/:id
 *      - DELETE /api/v1/trips/:id
 *
 * Auth strategy:
 *   @clerk/express is mocked so that:
 *     • clerkMiddleware() → no-op (passes through)
 *     • getAuth(req)      → { userId: req.headers["x-test-clerk-id"] ?? null }
 *   Setting the "x-test-clerk-id" header to a user's clerkId lets resolveDbUser
 *   look that user up in the in-memory DB and attach req.dbUserId - exactly as
 *   it would in production, without touching real Clerk infrastructure.
 *
 * Note: I have used AI to generate these tests based on the requirements and my knowledge of the codebase, but I have personally reviewed and edited each test case to ensure accuracy and relevance. The AI assisted in creating a comprehensive set of scenarios, including edge cases, to thoroughly validate the Trip CRUD functionality.
 */

import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: (req: any) => ({
    userId: req.headers["x-test-clerk-id"] ?? null,
  }),
}));

import app from "../app.ts";
import {
  User,
  Trip,
  TripMember,
  Day,
  Activity,
  Comment,
  Checklist,
  ChecklistItem,
  File,
  Reservation,
  BudgetSettings,
  Expense,
  PendingInvite,
} from "../models/index.ts";
import * as tripService from "../services/trip.service.ts";
import {
  TripMemberRole,
  TripMemberStatus,
  ActivityType,
} from "../../../shared/types/index.ts";

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

function tripPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Tokyo Adventure",
    description: "A fun trip to Tokyo",
    startDate: "2025-09-01T00:00:00.000Z",
    endDate: "2025-09-05T00:00:00.000Z",
    travelerCount: 2,
    ...overrides,
  };
}

async function seedTrip(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return tripService.createTrip(userId, {
    title: "Seed Trip",
    startDate: "2025-09-01T00:00:00.000Z",
    endDate: "2025-09-03T00:00:00.000Z",
    ...overrides,
  } as any);
}

// =============================================================================
// 1. Trip Service - unit / integration tests
// =============================================================================

describe("Trip Service", () => {
  // ── createTrip ──────────────────────────────────────────────────────────────
  describe("createTrip", () => {
    it("creates a Trip document with the correct fields", async () => {
      const user = await createTestUser();

      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Paris Getaway",
        description: "Romantic trip",
        startDate: "2025-10-01T00:00:00.000Z",
        endDate: "2025-10-04T00:00:00.000Z",
        travelerCount: 2,
      });

      expect(trip.title).toBe("Paris Getaway");
      expect(trip.description).toBe("Romantic trip");
      expect(trip.travelerCount).toBe(2);
      expect(trip.createdBy.toString()).toBe(user._id.toString());
    });

    it("persists the Trip to the database", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const found = await Trip.findById(trip._id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe("Seed Trip");
    });

    it("creates an owner TripMember with role 'owner' and status 'active'", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const member = await TripMember.findOne({
        tripId: trip._id,
        userId: user._id,
      });

      expect(member).not.toBeNull();
      expect(member!.role).toBe(TripMemberRole.OWNER);
      expect(member!.status).toBe(TripMemberStatus.ACTIVE);
    });

    it("sets joinedAt on the owner TripMember", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const member = await TripMember.findOne({ tripId: trip._id });
      expect(member!.joinedAt).toBeInstanceOf(Date);
    });

    it("auto-generates the correct number of Day documents", async () => {
      const user = await createTestUser();
      // Sep 1 → Sep 5 inclusive = 5 days
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "5-Day Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-05T00:00:00.000Z",
      });

      const dayCount = await Day.countDocuments({ tripId: trip._id });
      expect(dayCount).toBe(5);
    });

    it("generates Day dates that exactly match the trip range", async () => {
      const user = await createTestUser();
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "3-Day Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-03T00:00:00.000Z",
      });

      const days = await Day.find({ tripId: trip._id }).sort({ date: 1 });
      const keys = days.map((d) => d.date.toISOString().slice(0, 10));
      expect(keys).toEqual(["2025-09-01", "2025-09-02", "2025-09-03"]);
    });

    it("handles a single-day trip (startDate === endDate)", async () => {
      const user = await createTestUser();
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Day Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-01T00:00:00.000Z",
      });

      const dayCount = await Day.countDocuments({ tripId: trip._id });
      expect(dayCount).toBe(1);
    });

    it("defaults travelerCount to 1 when not provided", async () => {
      const user = await createTestUser();
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Solo Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-02T00:00:00.000Z",
      });

      expect(trip.travelerCount).toBe(1);
    });

    it("throws ValidationError when endDate is before startDate", async () => {
      const user = await createTestUser();

      await expect(
        tripService.createTrip(user._id.toString(), {
          title: "Bad Trip",
          startDate: "2025-09-10T00:00:00.000Z",
          endDate: "2025-09-05T00:00:00.000Z",
        }),
      ).rejects.toThrow("endDate must be on or after startDate");
    });

    it("does NOT create any Day documents when the trip fails validation", async () => {
      const user = await createTestUser();
      const before = await Day.countDocuments({});

      await expect(
        tripService.createTrip(user._id.toString(), {
          title: "Bad Trip",
          startDate: "2025-09-10T00:00:00.000Z",
          endDate: "2025-09-05T00:00:00.000Z",
        }),
      ).rejects.toThrow();

      const after = await Day.countDocuments({});
      expect(after).toBe(before);
    });
  });

  // ── getUserTrips ─────────────────────────────────────────────────────────────
  describe("getUserTrips", () => {
    it("returns all active trips for the authenticated user", async () => {
      const user = await createTestUser();
      await seedTrip(user._id.toString(), { title: "Trip A" });
      await seedTrip(user._id.toString(), { title: "Trip B" });

      const trips = await tripService.getUserTrips(user._id.toString());
      expect(trips).toHaveLength(2);
    });

    it("returns an empty array when the user has no memberships", async () => {
      const user = await createTestUser();
      const trips = await tripService.getUserTrips(user._id.toString());
      expect(trips).toEqual([]);
    });

    it("does not return trips owned by other users", async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();
      await seedTrip(userA._id.toString(), { title: "User A's Trip" });

      const trips = await tripService.getUserTrips(userB._id.toString());
      expect(trips).toHaveLength(0);
    });

    it("includes a 'role' field on each returned trip entry", async () => {
      const user = await createTestUser();
      await seedTrip(user._id.toString());

      const trips = await tripService.getUserTrips(user._id.toString());
      expect(trips[0]).toHaveProperty("role", TripMemberRole.OWNER);
    });

    it("returns trips sorted newest-first by createdAt", async () => {
      const user = await createTestUser();
      const userId = user._id.toString();

      const tripA = await seedTrip(userId, { title: "First Trip" });
      // Small delay so createdAt timestamps differ
      await new Promise((r) => setTimeout(r, 20));
      const tripB = await seedTrip(userId, { title: "Second Trip" });

      const trips = await tripService.getUserTrips(userId);
      const ids = trips.map((t: any) => t._id.toString());

      expect(ids[0]).toBe(tripB._id.toString());
      expect(ids[1]).toBe(tripA._id.toString());
    });
  });

  // ── getTripById ──────────────────────────────────────────────────────────────
  describe("getTripById", () => {
    it("returns the trip document", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString(), {
        title: "Specific Trip",
      });

      const result = await tripService.getTripById(trip._id.toString());
      expect(result).not.toBeNull();
      expect(result!._id.toString()).toBe(trip._id.toString());
      expect(result!.title).toBe("Specific Trip");
    });

    it("populates the createdBy field with name and email", async () => {
      const user = await createTestUser({ name: "Jane Doe" });
      const trip = await seedTrip(user._id.toString());

      const result = await tripService.getTripById(trip._id.toString());
      const creator = result!.createdBy as any;

      expect(creator.name).toBe("Jane Doe");
      expect(creator.email).toBeDefined();
    });

    it("throws NotFoundError for a non-existent trip ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(tripService.getTripById(fakeId)).rejects.toThrow(
        "Trip not found",
      );
    });
  });

  // ── updateTrip ───────────────────────────────────────────────────────────────
  describe("updateTrip", () => {
    it("updates scalar fields (title, description, travelerCount)", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const updated = await tripService.updateTrip(trip._id.toString(), {
        title: "Updated Title",
        description: "Fresh description",
        travelerCount: 5,
      });

      expect(updated!.title).toBe("Updated Title");
      expect(updated!.description).toBe("Fresh description");
      expect(updated!.travelerCount).toBe(5);
    });

    it("updates coverImageUrl", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const updated = await tripService.updateTrip(trip._id.toString(), {
        coverImageUrl: "https://example.com/cover.jpg",
      });

      expect(updated!.coverImageUrl).toBe("https://example.com/cover.jpg");
    });

    it("persists changes to the database", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await tripService.updateTrip(trip._id.toString(), {
        title: "Persisted Title",
      });

      const fromDb = await Trip.findById(trip._id);
      expect(fromDb!.title).toBe("Persisted Title");
    });

    it("does NOT touch Day documents when dates are unchanged", async () => {
      const user = await createTestUser();
      // Sep 1–3 → 3 days
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Stable Dates",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-03T00:00:00.000Z",
      });

      const before = await Day.countDocuments({ tripId: trip._id });
      await tripService.updateTrip(trip._id.toString(), {
        title: "Same Dates, New Title",
      });
      const after = await Day.countDocuments({ tripId: trip._id });

      expect(after).toBe(before);
    });

    it("adds new Day documents when the date range expands", async () => {
      const user = await createTestUser();
      // Sep 1–3 (3 days)
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Expanding Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-03T00:00:00.000Z",
      });

      // Expand to Sep 1–6 (6 days) → 3 new days added
      await tripService.updateTrip(trip._id.toString(), {
        endDate: "2025-09-06T00:00:00.000Z",
      });

      const days = await Day.find({ tripId: trip._id }).sort({ date: 1 });
      expect(days).toHaveLength(6);

      const keys = days.map((d) => d.date.toISOString().slice(0, 10));
      expect(keys).toContain("2025-09-04");
      expect(keys).toContain("2025-09-05");
      expect(keys).toContain("2025-09-06");
    });

    it("removes Day documents when the date range shrinks", async () => {
      const user = await createTestUser();
      // Sep 1–5 (5 days)
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Shrinking Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-05T00:00:00.000Z",
      });

      // Shrink to Sep 2–4 (3 days) → Sep 1 and Sep 5 removed
      await tripService.updateTrip(trip._id.toString(), {
        startDate: "2025-09-02T00:00:00.000Z",
        endDate: "2025-09-04T00:00:00.000Z",
      });

      const days = await Day.find({ tripId: trip._id }).sort({ date: 1 });
      expect(days).toHaveLength(3);

      const keys = days.map((d) => d.date.toISOString().slice(0, 10));
      expect(keys).toEqual(["2025-09-02", "2025-09-03", "2025-09-04"]);
    });

    it("deletes Activities on days that fall outside the new range", async () => {
      const user = await createTestUser();
      // Sep 1–3
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Activity Cleanup Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-03T00:00:00.000Z",
      });

      // Plant an Activity on Sep 1 (the day that will be cut)
      const sep1Day = await Day.findOne({
        tripId: trip._id,
        date: new Date("2025-09-01T00:00:00.000Z"),
      });
      const activity = await Activity.create({
        dayId: sep1Day!._id,
        tripId: trip._id,
        title: "Morning Hike",
        type: ActivityType.SIGHTSEEING,
        position: 0,
        createdBy: user._id,
      });

      // Shrink to Sep 2–3 → Sep 1 (and its Activity) should be removed
      await tripService.updateTrip(trip._id.toString(), {
        startDate: "2025-09-02T00:00:00.000Z",
      });

      const found = await Activity.findById(activity._id);
      expect(found).toBeNull();
    });

    it("preserves Activities on days that remain inside the new range", async () => {
      const user = await createTestUser();
      // Sep 1–3
      const trip = await tripService.createTrip(user._id.toString(), {
        title: "Keep Activities Trip",
        startDate: "2025-09-01T00:00:00.000Z",
        endDate: "2025-09-03T00:00:00.000Z",
      });

      // Activity on Sep 2 - this day stays after the update
      const sep2Day = await Day.findOne({
        tripId: trip._id,
        date: new Date("2025-09-02T00:00:00.000Z"),
      });
      const activity = await Activity.create({
        dayId: sep2Day!._id,
        tripId: trip._id,
        title: "Lunch Break",
        type: ActivityType.FOOD,
        position: 0,
        createdBy: user._id,
      });

      // Only cut Sep 1 from the front
      await tripService.updateTrip(trip._id.toString(), {
        startDate: "2025-09-02T00:00:00.000Z",
      });

      const found = await Activity.findById(activity._id);
      expect(found).not.toBeNull();
    });

    it("throws ValidationError when new endDate is before new startDate", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await expect(
        tripService.updateTrip(trip._id.toString(), {
          startDate: "2025-09-10T00:00:00.000Z",
          endDate: "2025-09-05T00:00:00.000Z",
        }),
      ).rejects.toThrow("endDate must be on or after startDate");
    });

    it("throws NotFoundError for a non-existent trip ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        tripService.updateTrip(fakeId, { title: "Ghost Trip" }),
      ).rejects.toThrow("Trip not found");
    });
  });

  // ── deleteTripCascade ────────────────────────────────────────────────────────
  describe("deleteTripCascade", () => {
    it("deletes the Trip document itself", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await tripService.deleteTripCascade(trip._id.toString());

      const found = await Trip.findById(trip._id);
      expect(found).toBeNull();
    });

    it("deletes all TripMember records for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      // Sanity check: owner member was created
      expect(await TripMember.countDocuments({ tripId: trip._id })).toBe(1);

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await TripMember.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes all Day records for the trip", async () => {
      const user = await createTestUser();
      // 3-day trip seeded via seedTrip
      const trip = await seedTrip(user._id.toString());

      expect(await Day.countDocuments({ tripId: trip._id })).toBeGreaterThan(0);

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await Day.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes all Activity records for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());
      const day = await Day.findOne({ tripId: trip._id });

      await Activity.create({
        dayId: day!._id,
        tripId: trip._id,
        title: "City Tour",
        type: ActivityType.SIGHTSEEING,
        position: 0,
        createdBy: user._id,
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await Activity.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes all Comment records for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());
      const day = await Day.findOne({ tripId: trip._id });

      await Comment.create({
        tripId: trip._id,
        targetType: "day",
        targetId: day!._id,
        body: "What a day!",
        authorId: user._id,
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await Comment.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes all Checklist records and their ChecklistItems for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const checklist = await Checklist.create({
        tripId: trip._id,
        title: "Packing List",
        position: 0,
        createdBy: user._id,
      });
      await ChecklistItem.create({
        checklistId: checklist._id,
        label: "Passport",
        isChecked: false,
        position: 0,
      });
      await ChecklistItem.create({
        checklistId: checklist._id,
        label: "Sunscreen",
        isChecked: false,
        position: 1,
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await Checklist.countDocuments({ tripId: trip._id })).toBe(0);
      expect(
        await ChecklistItem.countDocuments({ checklistId: checklist._id }),
      ).toBe(0);
    });

    it("deletes all File records for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await File.create({
        tripId: trip._id,
        filename: "itinerary.pdf",
        originalName: "itinerary.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        cloudinaryId: "cloud_abc",
        cloudinaryUrl: "https://res.cloudinary.com/example/file.pdf",
        uploadedBy: user._id,
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await File.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes all Reservation records for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await Reservation.create({
        tripId: trip._id,
        type: "flight",
        title: "Flight to Tokyo",
        createdBy: user._id,
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await Reservation.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes the BudgetSettings record for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await BudgetSettings.create({
        tripId: trip._id,
        totalBudget: 150000,
        currency: "INR",
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await BudgetSettings.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes all Expense records for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await Expense.create({
        tripId: trip._id,
        description: "Hotel",
        amount: 5000,
        currency: "INR",
        category: "accommodation",
        paidBy: user._id.toString(),
        createdBy: user._id,
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await Expense.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("deletes all PendingInvite records for the trip", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await PendingInvite.create({
        tripId: trip._id,
        email: "friend@example.com",
        role: "editor",
        invitedBy: user._id,
        token: `tok_${new mongoose.Types.ObjectId().toHexString()}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      });

      await tripService.deleteTripCascade(trip._id.toString());

      expect(await PendingInvite.countDocuments({ tripId: trip._id })).toBe(0);
    });

    it("cascades all child collections in a single call (full scenario)", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());
      const tripId = trip._id;
      const day = await Day.findOne({ tripId });

      // Seed one record in every child collection
      const activity = await Activity.create({
        dayId: day!._id,
        tripId,
        title: "Boat Tour",
        type: ActivityType.ACTIVITY,
        position: 0,
        createdBy: user._id,
      });
      await Comment.create({
        tripId,
        targetType: "activity",
        targetId: activity._id,
        body: "Can't wait!",
        authorId: user._id,
      });
      const checklist = await Checklist.create({
        tripId,
        title: "Gear List",
        position: 0,
        createdBy: user._id,
      });
      await ChecklistItem.create({
        checklistId: checklist._id,
        label: "Camera",
        isChecked: false,
        position: 0,
      });
      await File.create({
        tripId,
        filename: "map.png",
        originalName: "map.png",
        mimeType: "image/png",
        sizeBytes: 512,
        cloudinaryId: "cloud_xyz",
        cloudinaryUrl: "https://res.cloudinary.com/example/map.png",
        uploadedBy: user._id,
      });
      await Reservation.create({
        tripId,
        type: "hotel",
        title: "Grand Hotel",
        createdBy: user._id,
      });
      await BudgetSettings.create({
        tripId,
        totalBudget: 80000,
        currency: "INR",
      });
      await Expense.create({
        tripId,
        description: "Dinner",
        amount: 1200,
        currency: "INR",
        category: "food",
        paidBy: user._id.toString(),
        createdBy: user._id,
      });
      await PendingInvite.create({
        tripId,
        email: "guest@example.com",
        role: "viewer",
        invitedBy: user._id,
        token: `tok_${new mongoose.Types.ObjectId().toHexString()}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      });

      await tripService.deleteTripCascade(tripId.toString());

      const [
        tripDoc,
        members,
        days,
        activities,
        comments,
        checklists,
        checklistItems,
        files,
        reservations,
        budgets,
        expenses,
        invites,
      ] = await Promise.all([
        Trip.findById(tripId),
        TripMember.countDocuments({ tripId }),
        Day.countDocuments({ tripId }),
        Activity.countDocuments({ tripId }),
        Comment.countDocuments({ tripId }),
        Checklist.countDocuments({ tripId }),
        ChecklistItem.countDocuments({ checklistId: checklist._id }),
        File.countDocuments({ tripId }),
        Reservation.countDocuments({ tripId }),
        BudgetSettings.countDocuments({ tripId }),
        Expense.countDocuments({ tripId }),
        PendingInvite.countDocuments({ tripId }),
      ]);

      expect(tripDoc).toBeNull();
      expect(members).toBe(0);
      expect(days).toBe(0);
      expect(activities).toBe(0);
      expect(comments).toBe(0);
      expect(checklists).toBe(0);
      expect(checklistItems).toBe(0);
      expect(files).toBe(0);
      expect(reservations).toBe(0);
      expect(budgets).toBe(0);
      expect(expenses).toBe(0);
      expect(invites).toBe(0);
    });

    it("throws NotFoundError for a non-existent trip ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(tripService.deleteTripCascade(fakeId)).rejects.toThrow(
        "Trip not found",
      );
    });

    it("does not touch documents belonging to other trips", async () => {
      const user = await createTestUser();
      const tripA = await seedTrip(user._id.toString(), { title: "Trip A" });
      const tripB = await seedTrip(user._id.toString(), { title: "Trip B" });

      await tripService.deleteTripCascade(tripA._id.toString());

      // Trip B and its data should be completely untouched
      expect(await Trip.findById(tripB._id)).not.toBeNull();
      expect(
        await TripMember.countDocuments({ tripId: tripB._id }),
      ).toBeGreaterThan(0);
      expect(await Day.countDocuments({ tripId: tripB._id })).toBeGreaterThan(
        0,
      );
    });
  });
});

// =============================================================================
// 2. Trip API - HTTP integration tests via supertest
// =============================================================================

describe("Trip API", () => {
  // ── POST /api/v1/trips ───────────────────────────────────────────────────────
  describe("POST /api/v1/trips", () => {
    it("returns 401 when no auth header is provided", async () => {
      const res = await request(app).post("/api/v1/trips").send(tripPayload());

      expect(res.status).toBe(401);
    });

    it("returns 401 when the clerkId does not exist in the database", async () => {
      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", "clerk_ghost_user_xyz")
        .send(tripPayload());

      expect(res.status).toBe(401);
    });

    it("returns 201 and the created trip with a valid payload", async () => {
      const user = await createTestUser({ clerkId: "clerk_post_valid" });

      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(
          tripPayload({
            title: "API Created Trip",
            travelerCount: 3,
          }),
        );

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        title: "API Created Trip",
        travelerCount: 3,
      });
      expect(res.body.data._id).toBeDefined();
    });

    it("returns 400 when the title field is missing", async () => {
      const user = await createTestUser({ clerkId: "clerk_post_no_title" });
      const { title: _title, ...noTitle } = tripPayload() as any;

      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(noTitle);

      expect(res.status).toBe(400);
    });

    it("returns 400 when startDate is not a valid ISO datetime string", async () => {
      const user = await createTestUser({ clerkId: "clerk_post_bad_date" });

      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(tripPayload({ startDate: "not-a-real-date" }));

      expect(res.status).toBe(400);
    });

    it("returns 400 when endDate is before startDate", async () => {
      const user = await createTestUser({ clerkId: "clerk_post_bad_range" });

      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(
          tripPayload({
            startDate: "2025-09-10T00:00:00.000Z",
            endDate: "2025-09-05T00:00:00.000Z",
          }),
        );

      expect(res.status).toBe(400);
    });

    it("returns 400 when travelerCount is less than 1", async () => {
      const user = await createTestUser({ clerkId: "clerk_post_bad_count" });

      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(tripPayload({ travelerCount: 0 }));

      expect(res.status).toBe(400);
    });

    it("creates an owner TripMember in the database after a successful POST", async () => {
      const user = await createTestUser({ clerkId: "clerk_post_member_check" });

      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(tripPayload());

      expect(res.status).toBe(201);

      const member = await TripMember.findOne({
        tripId: res.body.data._id,
        userId: user._id,
      });
      expect(member).not.toBeNull();
      expect(member!.role).toBe(TripMemberRole.OWNER);
    });

    it("creates the correct number of Day documents after a successful POST", async () => {
      const user = await createTestUser({ clerkId: "clerk_post_days_check" });

      const res = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(
          tripPayload({
            startDate: "2025-10-01T00:00:00.000Z",
            endDate: "2025-10-04T00:00:00.000Z", // 4 days
          }),
        );

      expect(res.status).toBe(201);
      const dayCount = await Day.countDocuments({ tripId: res.body.data._id });
      expect(dayCount).toBe(4);
    });
  });

  // ── GET /api/v1/trips ────────────────────────────────────────────────────────
  describe("GET /api/v1/trips", () => {
    it("returns 401 when no auth header is provided", async () => {
      const res = await request(app).get("/api/v1/trips");
      expect(res.status).toBe(401);
    });

    it("returns 200 with an empty array when the user has no trips", async () => {
      const user = await createTestUser({ clerkId: "clerk_get_list_empty" });

      const res = await request(app)
        .get("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("returns 200 with the user's trips", async () => {
      const user = await createTestUser({ clerkId: "clerk_get_list_trips" });
      await seedTrip(user._id.toString(), { title: "My First Trip" });
      await seedTrip(user._id.toString(), { title: "My Second Trip" });

      const res = await request(app)
        .get("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it("does not return trips belonging to other users", async () => {
      const userA = await createTestUser({ clerkId: "clerk_get_list_userA" });
      const userB = await createTestUser({ clerkId: "clerk_get_list_userB" });
      await seedTrip(userA._id.toString(), { title: "User A's Trip" });

      const res = await request(app)
        .get("/api/v1/trips")
        .set("x-test-clerk-id", userB.clerkId);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("includes a 'role' field on each trip in the response", async () => {
      const user = await createTestUser({ clerkId: "clerk_get_list_role" });
      await seedTrip(user._id.toString());

      const res = await request(app)
        .get("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId);

      expect(res.status).toBe(200);
      expect(res.body.data[0]).toHaveProperty("role", TripMemberRole.OWNER);
    });
  });

  // ── GET /api/v1/trips/:id ────────────────────────────────────────────────────
  describe("GET /api/v1/trips/:id", () => {
    it("returns 401 when no auth header is provided", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const res = await request(app).get(`/api/v1/trips/${trip._id}`);
      expect(res.status).toBe(401);
    });

    it("returns 404 when the requesting user is not a member of the trip", async () => {
      const owner = await createTestUser({ clerkId: "clerk_getbyid_owner" });
      const nonMember = await createTestUser({
        clerkId: "clerk_getbyid_nonmember",
      });
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", nonMember.clerkId);

      expect(res.status).toBe(404);
    });

    it("returns 200 with the trip for a member", async () => {
      const user = await createTestUser({ clerkId: "clerk_getbyid_member" });
      const trip = await seedTrip(user._id.toString(), {
        title: "Visible Trip",
      });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", user.clerkId);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(trip._id.toString());
      expect(res.body.data.title).toBe("Visible Trip");
    });

    it("returns 400 for a malformed (non-ObjectId) trip ID", async () => {
      const user = await createTestUser({ clerkId: "clerk_getbyid_badid" });

      const res = await request(app)
        .get("/api/v1/trips/not-a-valid-id")
        .set("x-test-clerk-id", user.clerkId);

      // requireMembership CastError → 404, errorHandler CastError → 400
      expect([400, 404]).toContain(res.status);
    });
  });

  // ── PATCH /api/v1/trips/:id ──────────────────────────────────────────────────
  describe("PATCH /api/v1/trips/:id", () => {
    it("returns 401 when no auth header is provided", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}`)
        .send({ title: "Hacked" });

      expect(res.status).toBe(401);
    });

    it("returns 404 when the requesting user is not the owner", async () => {
      const owner = await createTestUser({ clerkId: "clerk_patch_owner" });
      const editor = await createTestUser({ clerkId: "clerk_patch_editor" });
      const trip = await seedTrip(owner._id.toString());

      // Give editor an active membership but only as editor role
      await TripMember.create({
        tripId: trip._id,
        userId: editor._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", editor.clerkId)
        .send({ title: "Sneaky Edit" });

      expect(res.status).toBe(404);
    });

    it("returns 404 when the user has no membership at all", async () => {
      const owner = await createTestUser({ clerkId: "clerk_patch_owner2" });
      const stranger = await createTestUser({
        clerkId: "clerk_patch_stranger",
      });
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", stranger.clerkId)
        .send({ title: "Stranger Edit" });

      expect(res.status).toBe(404);
    });

    it("returns 200 and the updated trip when the owner updates fields", async () => {
      const user = await createTestUser({ clerkId: "clerk_patch_success" });
      const trip = await seedTrip(user._id.toString());

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", user.clerkId)
        .send({
          title: "Updated via API",
          description: "New description",
          travelerCount: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated via API");
      expect(res.body.data.description).toBe("New description");
      expect(res.body.data.travelerCount).toBe(4);
    });

    it("returns 400 when the payload violates schema (title too long)", async () => {
      const user = await createTestUser({ clerkId: "clerk_patch_bad_title" });
      const trip = await seedTrip(user._id.toString());

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", user.clerkId)
        .send({ title: "x".repeat(101) });

      expect(res.status).toBe(400);
    });

    it("returns 400 when the updated endDate is before the updated startDate", async () => {
      const user = await createTestUser({ clerkId: "clerk_patch_bad_range" });
      const trip = await seedTrip(user._id.toString());

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", user.clerkId)
        .send({
          startDate: "2025-09-10T00:00:00.000Z",
          endDate: "2025-09-05T00:00:00.000Z",
        });

      expect(res.status).toBe(400);
    });

    it("reconciles Day documents when the date range changes via API", async () => {
      const user = await createTestUser({ clerkId: "clerk_patch_dates" });

      // Create a 3-day trip via API so we get the real flow end-to-end
      const createRes = await request(app)
        .post("/api/v1/trips")
        .set("x-test-clerk-id", user.clerkId)
        .send(
          tripPayload({
            startDate: "2025-09-01T00:00:00.000Z",
            endDate: "2025-09-03T00:00:00.000Z",
          }),
        );
      expect(createRes.status).toBe(201);
      const tripId = createRes.body.data._id;

      // Extend to 5 days
      const patchRes = await request(app)
        .patch(`/api/v1/trips/${tripId}`)
        .set("x-test-clerk-id", user.clerkId)
        .send({ endDate: "2025-09-05T00:00:00.000Z" });

      expect(patchRes.status).toBe(200);
      expect(await Day.countDocuments({ tripId })).toBe(5);
    });
  });

  // ── DELETE /api/v1/trips/:id ─────────────────────────────────────────────────
  describe("DELETE /api/v1/trips/:id", () => {
    it("returns 401 when no auth header is provided", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const res = await request(app).delete(`/api/v1/trips/${trip._id}`);
      expect(res.status).toBe(401);
    });

    it("returns 404 when the requesting user is not the owner", async () => {
      const owner = await createTestUser({ clerkId: "clerk_delete_owner" });
      const viewer = await createTestUser({ clerkId: "clerk_delete_viewer" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: viewer._id,
        role: TripMemberRole.VIEWER,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      const res = await request(app)
        .delete(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", viewer.clerkId);

      expect(res.status).toBe(404);
    });

    it("returns 404 when the user has no membership at all", async () => {
      const owner = await createTestUser({ clerkId: "clerk_delete_owner2" });
      const stranger = await createTestUser({
        clerkId: "clerk_delete_stranger",
      });
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .delete(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", stranger.clerkId);

      expect(res.status).toBe(404);
    });

    it("returns 204 and removes the trip when the owner deletes it", async () => {
      const user = await createTestUser({ clerkId: "clerk_delete_success" });
      const trip = await seedTrip(user._id.toString());

      const res = await request(app)
        .delete(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", user.clerkId);

      expect(res.status).toBe(204);
      expect(await Trip.findById(trip._id)).toBeNull();
    });

    it("cascades all child data when the owner deletes the trip via API", async () => {
      const user = await createTestUser({ clerkId: "clerk_delete_cascade" });
      const trip = await seedTrip(user._id.toString());
      const tripId = trip._id;
      const day = await Day.findOne({ tripId });

      await Activity.create({
        dayId: day!._id,
        tripId,
        title: "Sightseeing",
        type: ActivityType.SIGHTSEEING,
        position: 0,
        createdBy: user._id,
      });
      await Comment.create({
        tripId,
        targetType: "day",
        targetId: day!._id,
        body: "Beautiful!",
        authorId: user._id,
      });
      const checklist = await Checklist.create({
        tripId,
        title: "Packing",
        position: 0,
        createdBy: user._id,
      });
      await ChecklistItem.create({
        checklistId: checklist._id,
        label: "Toothbrush",
        isChecked: false,
        position: 0,
      });

      const res = await request(app)
        .delete(`/api/v1/trips/${tripId}`)
        .set("x-test-clerk-id", user.clerkId);

      expect(res.status).toBe(204);

      expect(await Trip.findById(tripId)).toBeNull();
      expect(await Day.countDocuments({ tripId })).toBe(0);
      expect(await Activity.countDocuments({ tripId })).toBe(0);
      expect(await Comment.countDocuments({ tripId })).toBe(0);
      expect(await Checklist.countDocuments({ tripId })).toBe(0);
      expect(
        await ChecklistItem.countDocuments({ checklistId: checklist._id }),
      ).toBe(0);
    });

    it("returns 204 even when the trip has no child data at all", async () => {
      const user = await createTestUser({ clerkId: "clerk_delete_empty" });
      const trip = await seedTrip(user._id.toString());

      // Remove all Days manually so the trip is completely bare
      await Day.deleteMany({ tripId: trip._id });
      await TripMember.deleteMany({ tripId: trip._id });

      // Re-add the owner member so requireRole passes
      await TripMember.create({
        tripId: trip._id,
        userId: user._id,
        role: TripMemberRole.OWNER,
        status: TripMemberStatus.ACTIVE,
        invitedBy: user._id,
        joinedAt: new Date(),
      });

      const res = await request(app)
        .delete(`/api/v1/trips/${trip._id}`)
        .set("x-test-clerk-id", user.clerkId);

      expect(res.status).toBe(204);
    });
  });
});
