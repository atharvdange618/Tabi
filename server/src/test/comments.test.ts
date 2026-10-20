/**
 * comments.test.ts
 *
 * Comprehensive test suite for the Comments API.
 *
 * Structure:
 *   1. "Comments API" - HTTP integration tests
 *      - POST   /api/v1/trips/:id/comments
 *      - GET    /api/v1/trips/:id/comments?targetType=&targetId=
 *      - PATCH  /api/v1/trips/:id/comments/:commentId
 *      - DELETE /api/v1/trips/:id/comments/:commentId
 *
 * Covers: comments on both day and activity targets, author-only edit enforcement,
 * owner/editor moderation (deleting others' comments), cascade delete of child
 * comments, and query-param validation.
 *
 * Auth strategy: same Clerk mock as trips.test.ts.
 *
 * Note: I have used AI to generate these tests based on the requirements and my
 * knowledge of the codebase, but I have personally reviewed and edited each test
 * case to ensure accuracy and relevance. The AI assisted in creating a comprehensive
 * set of scenarios, including edge cases, to thoroughly validate the Comments CRUD functionality.
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

describe("Comments trip scoping", () => {
  async function seedCommentInOtherTrip() {
    const victim = await createTestUser();
    const victimTrip = await seedTrip(victim._id.toString());
    const [victimDay] = await dayService.getTripDays(victimTrip._id.toString());
    const comment = await Comment.create({
      tripId: victimTrip._id,
      targetType: "day",
      targetId: victimDay!._id,
      body: "Private to the victim trip",
      authorId: victim._id,
    });

    const attacker = await createTestUser();
    const attackerTrip = await seedTrip(attacker._id.toString());
    return { comment, victimDay: victimDay!, attacker, attackerTrip };
  }

  it("should not delete a comment that belongs to another trip", async () => {
    const { comment, attacker, attackerTrip } = await seedCommentInOtherTrip();

    await request(app)
      .delete(`/api/v1/trips/${attackerTrip._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", attacker.clerkId)
      .expect(404);

    expect(await Comment.findById(comment._id)).not.toBeNull();
  });

  it("should not react to a comment that belongs to another trip", async () => {
    const { comment, attacker, attackerTrip } = await seedCommentInOtherTrip();

    await request(app)
      .post(
        `/api/v1/trips/${attackerTrip._id}/comments/${comment._id}/reactions`,
      )
      .set("x-test-clerk-id", attacker.clerkId)
      .send({ emoji: "👍" })
      .expect(404);

    const after = await Comment.findById(comment._id).lean();
    expect(after?.reactions).toHaveLength(0);
  });

  it("should not edit an own comment through another trip's URL", async () => {
    const owner = await createTestUser();
    const tripA = await seedTrip(owner._id.toString());
    const tripB = await seedTrip(owner._id.toString());
    const [dayA] = await dayService.getTripDays(tripA._id.toString());
    const comment = await Comment.create({
      tripId: tripA._id,
      targetType: "day",
      targetId: dayA!._id,
      body: "Original",
      authorId: owner._id,
    });

    await request(app)
      .patch(`/api/v1/trips/${tripB._id}/comments/${comment._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ body: "Edited" })
      .expect(404);
  });

  it("should reject a comment whose target day is in another trip", async () => {
    const { victimDay, attacker, attackerTrip } =
      await seedCommentInOtherTrip();

    await request(app)
      .post(`/api/v1/trips/${attackerTrip._id}/comments`)
      .set("x-test-clerk-id", attacker.clerkId)
      .send({
        targetType: "day",
        targetId: victimDay._id.toString(),
        body: "Hello",
      })
      .expect(404);
  });

  it("should reject a reply whose parent is on a different target", async () => {
    const { comment, attacker, attackerTrip } = await seedCommentInOtherTrip();
    const [day] = await dayService.getTripDays(attackerTrip._id.toString());

    await request(app)
      .post(`/api/v1/trips/${attackerTrip._id}/comments`)
      .set("x-test-clerk-id", attacker.clerkId)
      .send({
        targetType: "day",
        targetId: day!._id.toString(),
        body: "Reply",
        parentId: comment._id.toString(),
      })
      .expect(404);
  });
});

describe("Comment reactions", () => {
  it("should remove a reaction when the same user toggles it twice", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const [day] = await dayService.getTripDays(trip._id.toString());
    const comment = await Comment.create({
      tripId: trip._id,
      targetType: "day",
      targetId: day!._id,
      body: "React to me",
      authorId: owner._id,
    });
    const url = `/api/v1/trips/${trip._id}/comments/${comment._id}/reactions`;

    const first = await request(app)
      .post(url)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ emoji: "👍" })
      .expect(200);
    expect(first.body.data.reactions).toHaveLength(1);
    expect(first.body.data.reactions[0].users).toHaveLength(1);

    const second = await request(app)
      .post(url)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ emoji: "👍" })
      .expect(200);
    expect(second.body.data.reactions).toHaveLength(0);
  });
});
