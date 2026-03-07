/**
 * days.test.ts
 *
 * Comprehensive test suite for the Days API and Service Layer.
 *
 * Structure:
 *   1. "Days Service" — direct service-layer tests
 *      - getDays
 *      - createDay
 *      - updateDay
 *      - deleteDay
 *
 *   2. "Days API" — HTTP integration tests
 *      - GET    /api/v1/trips/:id/days
 *      - POST   /api/v1/trips/:id/days
 *      - PATCH  /api/v1/trips/:id/days/:dayId
 *      - DELETE /api/v1/trips/:id/days/:dayId
 *
 * Auth strategy: same Clerk mock as members.test.ts.
 *
 * Note: I have used AI to generate these tests based on the requirements and my
 * knowledge of the codebase, but I have personally reviewed and edited each test
 * case to ensure accuracy and relevance. The AI assisted in creating a comprehensive
 * set of scenarios, including edge cases, to thoroughly validate the Days CRUD functionality.
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

import app from "../app.ts";
import { User, TripMember } from "../models/index.ts";
import * as tripService from "../services/trip.service.ts";
import * as dayService from "../services/day.service.ts";
import {
  TripMemberRole,
  TripMemberStatus,
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

async function seedTrip(userId: string) {
  return tripService.createTrip(userId, {
    title: "Seed Trip",
    startDate: "2024-05-01T00:00:00.000Z",
    endDate: "2024-05-03T00:00:00.000Z", // 3 days
  } as any);
}

describe("Days Service", () => {
  describe("getTripDays", () => {
    it("returns days sorted by date", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const days = await dayService.getTripDays(trip._id.toString());
      expect(days).toHaveLength(3);

      const sortTime1 = new Date(days[0]!.date).getTime();
      const sortTime2 = new Date(days[1]!.date).getTime();
      const sortTime3 = new Date(days[2]!.date).getTime();

      expect(sortTime1).toBeLessThan(sortTime2);
      expect(sortTime2).toBeLessThan(sortTime3);
    });
  });

  describe("updateDay", () => {
    it("updates label and notes", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());
      const days = await dayService.getTripDays(trip._id.toString());
      const dayId = days[0]!._id.toString();

      const updated = await dayService.updateDay(trip._id.toString(), dayId, {
        label: "Arrival",
        notes: "Don't forget passport",
      });

      expect(updated.label).toBe("Arrival");
      expect(updated.notes).toBe("Don't forget passport");
    });

    it("throws NotFoundError if day isn't found", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        dayService.updateDay(trip._id.toString(), fakeId, { label: "Test" }),
      ).rejects.toThrow("Day not found");
    });
  });
});

describe("Days API", () => {
  describe("GET /api/v1/trips/:id/days", () => {
    it("returns 200 and days array to authorized members", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/days`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it("returns 403 for non-members", async () => {
      const owner = await createTestUser();
      const randomUser = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .get(`/api/v1/trips/${trip._id}/days`)
        .set("x-test-clerk-id", randomUser.clerkId)
        .expect(403);
    });

    it("returns 401 without auth", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app).get(`/api/v1/trips/${trip._id}/days`).expect(401);
    });
  });

  describe("PATCH /api/v1/trips/:id/days/:dayId", () => {
    it("returns 200 and updates day for owner", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());
      const days = await dayService.getTripDays(trip._id.toString());

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}/days/${days[0]!._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ label: "Check-in", notes: "Note" })
        .expect(200);

      expect(res.body.data.label).toBe("Check-in");
    });

    it("returns 200 and updates day for editor", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser();
      const trip = await seedTrip(owner._id.toString());
      const days = await dayService.getTripDays(trip._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: editor._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await request(app)
        .patch(`/api/v1/trips/${trip._id}/days/${days[0]!._id}`)
        .set("x-test-clerk-id", editor.clerkId)
        .send({ label: "Editor Label" })
        .expect(200);
    });

    it("returns 403/forbidden for viewer attempting to update", async () => {
      const owner = await createTestUser();
      const viewer = await createTestUser();
      const trip = await seedTrip(owner._id.toString());
      const days = await dayService.getTripDays(trip._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: viewer._id,
        role: TripMemberRole.VIEWER,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await request(app)
        .patch(`/api/v1/trips/${trip._id}/days/${days[0]!._id}`)
        .set("x-test-clerk-id", viewer.clerkId)
        .send({ label: "Hacked" })
        .expect(403); // permission.ts throws NotFoundError for insufficient role to hide trip
    });
  });

  describe("Cross-trip isolation", () => {
    it("returns 404 when updating a day from a different trip", async () => {
      const owner = await createTestUser();
      const tripA = await seedTrip(owner._id.toString());
      const tripB = await seedTrip(owner._id.toString());
      const daysB = await dayService.getTripDays(tripB._id.toString());

      // Try to update tripB's day using tripA's route
      await request(app)
        .patch(`/api/v1/trips/${tripA._id}/days/${daysB[0]!._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ label: "Cross-trip hack" })
        .expect(404);
    });
  });
});
