/**
 * activities.test.ts
 *
 * Comprehensive test suite for the Activities API and Service Layer.
 *
 * Structure:
 *   1. "Activities Service" - direct service-layer tests
 *      - createActivity
 *      - updateActivity
 *      - deleteActivity
 *      - reorderActivities
 *
 *   2. "Activities API" - HTTP integration tests
 *      - GET    /api/v1/trips/:id/days/:dayId/activities
 *      - POST   /api/v1/trips/:id/days/:dayId/activities
 *      - PATCH  /api/v1/trips/:id/days/:dayId/activities/:actId
 *      - DELETE /api/v1/trips/:id/days/:dayId/activities/:actId
 *      - PATCH  /api/v1/trips/:id/days/:dayId/activities/reorder
 *
 * Auth strategy: same Clerk mock as members.test.ts.
 *
 * Note: I have used AI to generate these tests based on the requirements and my
 * knowledge of the codebase, but I have personally reviewed and edited each test
 * case to ensure accuracy and relevance. The AI assisted in creating a comprehensive
 * set of scenarios, including edge cases, to thoroughly validate the Activities CRUD functionality.
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
import { User, Activity, TripMember } from "../models/index.ts";
import * as tripService from "../services/trip.service.ts";
import * as dayService from "../services/day.service.ts";
import * as activityService from "../services/activity.service.ts";
import {
  ActivityType,
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

describe("Activities API", () => {
  it("should create an activity", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const res = await request(app)
      .post(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({
        title: "Visit Museum",
        type: ActivityType.SIGHTSEEING,
        estimatedCost: 20,
      })
      .expect(201);

    expect(res.body.data.title).toBe("Visit Museum");
    expect(res.body.data.position).toBe(1024);
  });

  it("should append subsequent activities with incremented positions", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await activityService.createActivity(
      trip._id.toString(),
      day._id.toString(),
      owner._id.toString(),
      { title: "First", type: ActivityType.SIGHTSEEING },
    );

    const res = await request(app)
      .post(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({
        title: "Second",
        type: ActivityType.FOOD,
      })
      .expect(201);

    expect(res.body.data.title).toBe("Second");
    expect(res.body.data.position).toBe(2048);
  });

  it("should get activities for a day sorted by position", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await Activity.create({
      tripId: trip._id,
      dayId: day._id,
      createdBy: owner._id,
      title: "Pos 2048",
      type: ActivityType.OTHER,
      position: 2048,
    });
    await Activity.create({
      tripId: trip._id,
      dayId: day._id,
      createdBy: owner._id,
      title: "Pos 1024",
      type: ActivityType.OTHER,
      position: 1024,
    });

    const res = await request(app)
      .get(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    const activities = res.body.data;
    expect(activities).toHaveLength(2);
    expect(activities[0].title).toBe("Pos 1024");
    expect(activities[1].title).toBe("Pos 2048");
  });

  it("should update an activity", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const act = await activityService.createActivity(
      trip._id.toString(),
      day._id.toString(),
      owner._id.toString(),
      { title: "Initial", type: ActivityType.SIGHTSEEING },
    );

    const res = await request(app)
      .patch(`/api/v1/trips/${trip._id}/days/${day._id}/activities/${act._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ location: "123 Main St" })
      .expect(200);

    expect(res.body.data.location).toBe("123 Main St");
  });

  it("should bulk reorder activities", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const act1 = await activityService.createActivity(
      trip._id.toString(),
      day._id.toString(),
      owner._id.toString(),
      { title: "First", type: ActivityType.SIGHTSEEING },
    );
    const act2 = await activityService.createActivity(
      trip._id.toString(),
      day._id.toString(),
      owner._id.toString(),
      { title: "Second", type: ActivityType.SIGHTSEEING },
    );

    await request(app)
      .patch(`/api/v1/trips/${trip._id}/days/${day._id}/activities/reorder`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({
        activities: [
          { _id: act1._id.toString(), position: 2048 },
          { _id: act2._id.toString(), position: 1024 },
        ],
      })
      .expect(200);

    const verifyRes = await request(app)
      .get(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    const reorderedActs = verifyRes.body.data;
    expect(reorderedActs[0].title).toBe("Second");
    expect(reorderedActs[0].position).toBe(1024);
    expect(reorderedActs[1].title).toBe("First"); // Validate the second activity's title
    expect(reorderedActs[1].position).toBe(2048); // Validate the second activity's position
  });

  it("should delete an activity", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const act = await activityService.createActivity(
      trip._id.toString(),
      day._id.toString(),
      owner._id.toString(),
      { title: "To be deleted", type: ActivityType.SIGHTSEEING },
    );

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/days/${day._id}/activities/${act._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(204);

    const verifyRes = await request(app)
      .get(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    expect(verifyRes.body.data).toHaveLength(0);
  });

  // ── Role-based access control ──────────────────────────────────────────────

  it("should allow editor to create activities", async () => {
    const owner = await createTestUser();
    const editor = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await TripMember.create({
      tripId: trip._id,
      userId: editor._id,
      role: TripMemberRole.EDITOR,
      status: TripMemberStatus.ACTIVE,
      invitedBy: owner._id,
      joinedAt: new Date(),
    });

    await request(app)
      .post(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", editor.clerkId)
      .send({ title: "Editor Activity", type: ActivityType.SIGHTSEEING })
      .expect(201);
  });

  it("should deny viewer from creating activities", async () => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await TripMember.create({
      tripId: trip._id,
      userId: viewer._id,
      role: TripMemberRole.VIEWER,
      status: TripMemberStatus.ACTIVE,
      invitedBy: owner._id,
      joinedAt: new Date(),
    });

    await request(app)
      .post(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", viewer.clerkId)
      .send({ title: "Viewer Activity", type: ActivityType.SIGHTSEEING })
      .expect(403);
  });

  it("should deny non-member from viewing activities", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await request(app)
      .get(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", stranger.clerkId)
      .expect(403);
  });

  it("should return 401 for unauthenticated requests", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await request(app)
      .get(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .expect(401);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it("should return 404 when creating activity on invalid dayId", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const fakeDayId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .post(`/api/v1/trips/${trip._id}/days/${fakeDayId}/activities`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ title: "Ghost", type: ActivityType.SIGHTSEEING })
      .expect(404);
  });

  it("should return 404 when deleting a non-existent activity", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;
    const fakeActId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .delete(
        `/api/v1/trips/${trip._id}/days/${day._id}/activities/${fakeActId}`,
      )
      .set("x-test-clerk-id", owner.clerkId)
      .expect(404);
  });

  it("should handle empty reorder array gracefully", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await request(app)
      .patch(`/api/v1/trips/${trip._id}/days/${day._id}/activities/reorder`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ activities: [] })
      .expect(200);
  });
});
