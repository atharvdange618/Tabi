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
import { User, TripMember, Comment } from "../models/index.ts";
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

describe("Comments API", () => {
  it("should create a comment on a day", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const res = await request(app)
      .post(`/api/v1/trips/${trip._id}/comments`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({
        targetType: "day",
        targetId: day._id.toString(),
        body: "First comment on this day",
      })
      .expect(201);

    expect(res.body.data.body).toBe("First comment on this day");
    expect(res.body.data.targetType).toBe("day");
    expect(res.body.data.authorId._id.toString()).toBe(owner._id.toString());
    expect(res.body.data.authorId.name).toBe(owner.name);
  });

  it("should get comments for a specific target", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Test comment",
      authorId: owner._id,
    });

    const res = await request(app)
      .get(
        `/api/v1/trips/${trip._id}/comments?targetType=day&targetId=${day._id}`,
      )
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].body).toBe("Test comment");
    expect(res.body.data[0].authorId._id.toString()).toBe(owner._id.toString());
  });

  it("should allow author to update a comment", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const comment = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Original text",
      authorId: owner._id,
    });

    const res = await request(app)
      .patch(`/api/v1/trips/${trip._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ body: "Updated text" })
      .expect(200);

    expect(res.body.data.body).toBe("Updated text");
    expect(res.body.data.isEdited).toBe(true);
  });

  it("should deny updating someone else's comment", async () => {
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

    const comment = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Owner's comment",
      authorId: owner._id,
    });

    await request(app)
      .patch(`/api/v1/trips/${trip._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", editor.clerkId)
      .send({ body: "Malicious update" })
      .expect(404); // Returns 404 because condition includes `authorId`
  });

  it("should allow author to delete their own comment", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const comment = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "To be deleted",
      authorId: owner._id,
    });

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    const deleted = await Comment.findById(comment._id);
    expect(deleted).toBeNull();
  });

  it("should allow an owner to delete a viewer's comment", async () => {
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

    const comment = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Viewer comment",
      authorId: viewer._id,
    });

    // Owner deletes viewer's comment
    await request(app)
      .delete(`/api/v1/trips/${trip._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    const deleted = await Comment.findById(comment._id);
    expect(deleted).toBeNull();
  });

  it("should deny a viewer from deleting an owner's comment", async () => {
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

    const comment = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Owner's comment",
      authorId: owner._id,
    });

    // Viewer attempts to delete owner's comment
    await request(app)
      .delete(`/api/v1/trips/${trip._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", viewer.clerkId)
      .expect(403);
  });

  it("should allow an editor to delete a viewer's comment", async () => {
    const owner = await createTestUser();
    const editor = await createTestUser();
    const viewer = await createTestUser();
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

    await TripMember.create({
      tripId: trip._id,
      userId: viewer._id,
      role: TripMemberRole.VIEWER,
      status: TripMemberStatus.ACTIVE,
      invitedBy: owner._id,
      joinedAt: new Date(),
    });

    const comment = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Viewer comment to be removed by editor",
      authorId: viewer._id,
    });

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", editor.clerkId)
      .expect(200);

    const deleted = await Comment.findById(comment._id);
    expect(deleted).toBeNull();
  });

  it("should cascade-delete child comments when parent is deleted", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    const parent = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Parent comment",
      authorId: owner._id,
    });

    const child = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day._id,
      body: "Reply to parent",
      authorId: owner._id,
      parentId: parent._id,
    });

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/comments/${parent._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    const deletedParent = await Comment.findById(parent._id);
    const deletedChild = await Comment.findById(child._id);
    expect(deletedParent).toBeNull();
    expect(deletedChild).toBeNull();
  });

  it("should return 400 when GET is missing query params", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    await request(app)
      .get(`/api/v1/trips/${trip._id}/comments`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(400);
  });

  it("should return 400 when GET has invalid targetType", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    await request(app)
      .get(`/api/v1/trips/${trip._id}/comments?targetType=invalid&targetId=abc`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(400);
  });

  it("should return 400 when POST body fails validation", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    await request(app)
      .post(`/api/v1/trips/${trip._id}/comments`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ body: "" })
      .expect(400);
  });

  it("should create and retrieve a comment on an activity", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const days = await dayService.getTripDays(trip._id.toString());
    const day = days[0]!;

    // Create an activity to comment on
    const actRes = await request(app)
      .post(`/api/v1/trips/${trip._id}/days/${day._id}/activities`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ title: "Visit shrine", type: "sightseeing" })
      .expect(201);

    const activityId = actRes.body.data._id;

    // Create comment on the activity
    const commentRes = await request(app)
      .post(`/api/v1/trips/${trip._id}/comments`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({
        targetType: "activity",
        targetId: activityId,
        body: "Don't forget to bring the camera",
      })
      .expect(201);

    expect(commentRes.body.data.targetType).toBe("activity");

    // Retrieve it
    const getRes = await request(app)
      .get(
        `/api/v1/trips/${trip._id}/comments?targetType=activity&targetId=${activityId}`,
      )
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    expect(getRes.body.data).toHaveLength(1);
    expect(getRes.body.data[0].body).toBe("Don't forget to bring the camera");
  });
});
