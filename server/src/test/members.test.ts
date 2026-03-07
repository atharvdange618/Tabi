/**
 * members.test.ts
 *
 * Comprehensive test suite for the Member & Invite System (Stage 6).
 *
 * Structure:
 *   1. "Member Service" - direct service-layer tests
 *      - getMembers
 *      - inviteMember (existing user + non-existing user paths)
 *      - acceptInvite
 *      - declineInvite
 *      - updateMemberRole
 *      - removeMember
 *
 *   2. "Member API" - HTTP integration tests
 *      - GET    /api/v1/trips/:id/members
 *      - POST   /api/v1/trips/:id/members/invite
 *      - PATCH  /api/v1/trips/:id/members/:uid
 *      - DELETE /api/v1/trips/:id/members/:uid
 *      - POST   /api/v1/invites/:token/accept
 *      - POST   /api/v1/invites/:token/decline
 *
 * Auth strategy: same Clerk mock as trips.test.ts.
 * Email: mocked via vi.mock so no real emails are sent.
 *
 * Note: I have used AI to generate these tests based on the requirements and my
 * knowledge of the codebase, but I have personally reviewed and edited each test
 * case to ensure accuracy and relevance. The AI assisted in creating a comprehensive
 * set of scenarios, including edge cases, to thoroughly validate the Members and Invites CRUD functionality.
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

// Mock email module - no real emails during tests
vi.mock("../lib/email.ts", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

import app from "../app.ts";
import { User, TripMember, PendingInvite } from "../models/index.ts";
import * as tripService from "../services/trip.service.ts";
import * as memberService from "../services/member.service.ts";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    title: "Seed Trip",
    startDate: "2025-09-01T00:00:00.000Z",
    endDate: "2025-09-03T00:00:00.000Z",
    ...overrides,
  } as any);
}

// =============================================================================
// 1. Member Service - unit / integration tests
// =============================================================================

describe("Member Service", () => {
  // ── getMembers ────────────────────────────────────────────────────────────

  describe("getMembers", () => {
    it("returns the owner as a member after trip creation", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const members = await memberService.getMembers(trip._id.toString());
      expect(members).toHaveLength(1);
      expect(members[0]!.role).toBe(TripMemberRole.OWNER);
    });

    it("populates userId with name, email, and avatarUrl", async () => {
      const user = await createTestUser({ name: "Alice" });
      const trip = await seedTrip(user._id.toString());

      const members = await memberService.getMembers(trip._id.toString());
      const populated = members[0]!.userId as any;
      expect(populated.name).toBe("Alice");
      expect(populated.email).toBeDefined();
    });

    it("returns an empty array for a trip with no members", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const members = await memberService.getMembers(fakeId);
      expect(members).toEqual([]);
    });
  });

  // ── inviteMember ──────────────────────────────────────────────────────────

  describe("inviteMember", () => {
    it("creates TripMember (pending) + PendingInvite when invitee is an existing user", async () => {
      const owner = await createTestUser({ name: "Owner" });
      const invitee = await createTestUser({ email: "invitee@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "invitee@example.com", role: "editor" },
      );

      const member = await TripMember.findOne({
        tripId: trip._id,
        userId: invitee._id,
      });
      expect(member).not.toBeNull();
      expect(member!.status).toBe(TripMemberStatus.PENDING);
      expect(member!.role).toBe(TripMemberRole.EDITOR);

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "invitee@example.com",
      });
      expect(invite).not.toBeNull();
      expect(invite!.token).toBeTruthy();
    });

    it("creates only PendingInvite when invitee is not an existing user", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "stranger@example.com", role: "viewer" },
      );

      // No TripMember for unknown email
      const members = await TripMember.find({ tripId: trip._id });
      // Only the owner
      expect(members).toHaveLength(1);

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "stranger@example.com",
      });
      expect(invite).not.toBeNull();
      expect(invite!.role).toBe("viewer");
    });

    it("throws ConflictError if user is already an active member", async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser({ email: "member@example.com" });
      const trip = await seedTrip(owner._id.toString());

      // Manually add as active member
      await TripMember.create({
        tripId: trip._id,
        userId: invitee._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await expect(
        memberService.inviteMember(trip._id.toString(), owner._id.toString(), {
          email: "member@example.com",
          role: "editor",
        }),
      ).rejects.toThrow("User is already an active member of this trip");
    });

    it("throws ConflictError on duplicate invite to same email", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "twice@example.com", role: "editor" },
      );

      await expect(
        memberService.inviteMember(trip._id.toString(), owner._id.toString(), {
          email: "twice@example.com",
          role: "viewer",
        }),
      ).rejects.toThrow("already pending");
    });

    it("lowercases the email before storage", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "UPPER@EXAMPLE.COM", role: "editor" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "upper@example.com",
      });
      expect(invite).not.toBeNull();
    });

    it("sets expiresAt to approximately 7 days from now", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const before = Date.now();
      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "expiry@example.com", role: "editor" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "expiry@example.com",
      });

      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(invite!.expiresAt).getTime();
      // Should be within a 5-second tolerance of 7 days from now
      expect(expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs - 5000);
      expect(expiresAt).toBeLessThanOrEqual(before + sevenDaysMs + 5000);
    });
  });

  // ── acceptInvite ──────────────────────────────────────────────────────────

  describe("acceptInvite", () => {
    it("activates TripMember and deletes PendingInvite for existing user", async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser({ email: "accepter@example.com" });
      const trip = await seedTrip(owner._id.toString());

      const invite = await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "accepter@example.com", role: "editor" },
      );

      const result = await memberService.acceptInvite(
        (invite as any).token,
        invitee._id.toString(),
      );

      expect(result.status).toBe(TripMemberStatus.ACTIVE);
      expect(result.joinedAt).toBeInstanceOf(Date);

      // PendingInvite should be gone
      const remaining = await PendingInvite.findOne({
        tripId: trip._id,
        email: "accepter@example.com",
      });
      expect(remaining).toBeNull();
    });

    it("creates TripMember for a user who signed up after being invited", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      // Invite to an email that doesn't have a user yet
      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "latecomer@example.com", role: "viewer" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "latecomer@example.com",
      });

      // Now the user signs up (simulated)
      const newUser = await createTestUser({ email: "latecomer@example.com" });

      const result = await memberService.acceptInvite(
        invite!.token,
        newUser._id.toString(),
      );

      expect(result.status).toBe(TripMemberStatus.ACTIVE);
      expect(result.role).toBe("viewer");
    });

    it("throws NotFoundError for invalid token", async () => {
      const user = await createTestUser();
      await expect(
        memberService.acceptInvite("invalid_token", user._id.toString()),
      ).rejects.toThrow("Invite not found");
    });

    it("throws ForbiddenError when accepting user's email doesn't match invite", async () => {
      const owner = await createTestUser();
      const wrongUser = await createTestUser({ email: "wrong@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "correct@example.com", role: "editor" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "correct@example.com",
      });

      await expect(
        memberService.acceptInvite(invite!.token, wrongUser._id.toString()),
      ).rejects.toThrow("different email address");
    });
  });

  // ── declineInvite ─────────────────────────────────────────────────────────

  describe("declineInvite", () => {
    it("deletes PendingInvite and pending TripMember", async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser({ email: "decliner@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "decliner@example.com", role: "editor" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "decliner@example.com",
      });

      await memberService.declineInvite(invite!.token, invitee._id.toString());

      // Both should be cleaned up
      const remainingInvite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "decliner@example.com",
      });
      expect(remainingInvite).toBeNull();

      const remainingMember = await TripMember.findOne({
        tripId: trip._id,
        userId: invitee._id,
      });
      expect(remainingMember).toBeNull();
    });

    it("throws NotFoundError for invalid token", async () => {
      const user = await createTestUser();
      await expect(
        memberService.declineInvite("bad_token", user._id.toString()),
      ).rejects.toThrow("Invite not found");
    });

    it("throws ForbiddenError when declining user's email doesn't match", async () => {
      const owner = await createTestUser();
      const wrongUser = await createTestUser({ email: "imposter@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "real@example.com", role: "editor" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "real@example.com",
      });

      await expect(
        memberService.declineInvite(invite!.token, wrongUser._id.toString()),
      ).rejects.toThrow("different email address");
    });
  });

  // ── updateMemberRole ──────────────────────────────────────────────────────

  describe("updateMemberRole", () => {
    it("changes the target member's role", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser({ email: "editor@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: editor._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      const result = await memberService.updateMemberRole(
        trip._id.toString(),
        editor._id.toString(),
        { role: "viewer" },
        owner._id.toString(),
      );

      expect(result.role).toBe("viewer");
    });

    it("throws ForbiddenError when owner tries to change own role", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await expect(
        memberService.updateMemberRole(
          trip._id.toString(),
          owner._id.toString(),
          { role: "editor" },
          owner._id.toString(),
        ),
      ).rejects.toThrow("Cannot change your own role");
    });

    it("throws ValidationError when trying to set role to 'owner'", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser({ email: "target@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: editor._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await expect(
        memberService.updateMemberRole(
          trip._id.toString(),
          editor._id.toString(),
          { role: "owner" },
          owner._id.toString(),
        ),
      ).rejects.toThrow("Cannot assign owner role");
    });

    it("throws NotFoundError for a non-existent member", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        memberService.updateMemberRole(
          trip._id.toString(),
          fakeId,
          { role: "viewer" },
          owner._id.toString(),
        ),
      ).rejects.toThrow("Member not found");
    });
  });

  // ── removeMember ──────────────────────────────────────────────────────────

  describe("removeMember", () => {
    it("deletes the TripMember document", async () => {
      const owner = await createTestUser();
      const member = await createTestUser({ email: "removable@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: member._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await memberService.removeMember(
        trip._id.toString(),
        member._id.toString(),
        owner._id.toString(),
      );

      const found = await TripMember.findOne({
        tripId: trip._id,
        userId: member._id,
      });
      expect(found).toBeNull();
    });

    it("throws ForbiddenError when owner tries to remove self", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await expect(
        memberService.removeMember(
          trip._id.toString(),
          owner._id.toString(),
          owner._id.toString(),
        ),
      ).rejects.toThrow("Cannot remove yourself");
    });

    it("throws ForbiddenError when non-owner tries to remove a member", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser({ email: "sneaky@example.com" });
      const target = await createTestUser({ email: "target@example.com" });
      const trip = await seedTrip(owner._id.toString());

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
        userId: target._id,
        role: TripMemberRole.VIEWER,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      // editor can't remove another member
      await expect(
        memberService.removeMember(
          trip._id.toString(),
          target._id.toString(),
          editor._id.toString(),
        ),
      ).rejects.toThrow("Only the trip owner can remove members");
    });

    it("throws ForbiddenError when trying to remove a trip owner", async () => {
      const owner1 = await createTestUser();
      const owner2 = await createTestUser({ email: "owner2@example.com" });
      const trip = await seedTrip(owner1._id.toString());

      // Simulate a two-owner scenario for testing purposes
      await TripMember.create({
        tripId: trip._id,
        userId: owner2._id,
        role: TripMemberRole.OWNER,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner1._id,
        joinedAt: new Date(),
      });

      await expect(
        memberService.removeMember(
          trip._id.toString(),
          owner2._id.toString(),
          owner1._id.toString(),
        ),
      ).rejects.toThrow("Cannot remove the trip owner");
    });

    it("throws NotFoundError for a non-existent member", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        memberService.removeMember(
          trip._id.toString(),
          fakeId,
          owner._id.toString(),
        ),
      ).rejects.toThrow("Member not found");
    });
  });
});

// =============================================================================
// 2. Member API - HTTP integration tests
// =============================================================================

describe("Member API", () => {
  // ── GET /api/v1/trips/:id/members ───────────────────────────────────────

  describe("GET /trips/:id/members", () => {
    it("returns 200 with list of members", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/members`)
        .set("x-test-clerk-id", user.clerkId)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].role).toBe("owner");
    });

    it("returns 401 without auth", async () => {
      const user = await createTestUser();
      const trip = await seedTrip(user._id.toString());

      await request(app).get(`/api/v1/trips/${trip._id}/members`).expect(401);
    });

    it("returns 403 for non-member user", async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .get(`/api/v1/trips/${trip._id}/members`)
        .set("x-test-clerk-id", stranger.clerkId)
        .expect(403);
    });
  });

  // ── POST /api/v1/trips/:id/members/invite ──────────────────────────────

  describe("POST /trips/:id/members/invite", () => {
    it("returns 201 when owner invites a valid email", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .post(`/api/v1/trips/${trip._id}/members/invite`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ email: "newinvite@example.com", role: "editor" })
        .expect(201);

      expect(res.body.data.email).toBe("newinvite@example.com");
      expect(res.body.data.token).toBeTruthy();
    });

    it("returns 403 when non-owner tries to invite", async () => {
      const owner = await createTestUser();
      const viewer = await createTestUser({ email: "viewer@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: viewer._id,
        role: TripMemberRole.VIEWER,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await request(app)
        .post(`/api/v1/trips/${trip._id}/members/invite`)
        .set("x-test-clerk-id", viewer.clerkId)
        .send({ email: "someone@example.com", role: "editor" })
        .expect(403);
    });

    it("returns 400 with invalid email", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .post(`/api/v1/trips/${trip._id}/members/invite`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ email: "not-an-email", role: "editor" })
        .expect(400);
    });

    it("returns 400 with invalid role", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .post(`/api/v1/trips/${trip._id}/members/invite`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ email: "valid@example.com", role: "owner" })
        .expect(400);
    });
  });

  // ── PATCH /api/v1/trips/:id/members/:uid ─────────────────────────────────

  describe("PATCH /trips/:id/members/:uid", () => {
    it("returns 200 and updates the role", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser({ email: "ed@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: editor._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}/members/${editor._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ role: "viewer" })
        .expect(200);

      expect(res.body.data.role).toBe("viewer");
    });

    it("returns 403 when non-owner tries to update role", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser({ email: "ed2@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: editor._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await request(app)
        .patch(`/api/v1/trips/${trip._id}/members/${owner._id}`)
        .set("x-test-clerk-id", editor.clerkId)
        .send({ role: "viewer" })
        .expect(403);
    });
  });

  // ── DELETE /api/v1/trips/:id/members/:uid ────────────────────────────────

  describe("DELETE /trips/:id/members/:uid", () => {
    it("returns 204 when owner removes a member", async () => {
      const owner = await createTestUser();
      const member = await createTestUser({ email: "rem@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await TripMember.create({
        tripId: trip._id,
        userId: member._id,
        role: TripMemberRole.EDITOR,
        status: TripMemberStatus.ACTIVE,
        invitedBy: owner._id,
        joinedAt: new Date(),
      });

      await request(app)
        .delete(`/api/v1/trips/${trip._id}/members/${member._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(204);

      const found = await TripMember.findOne({
        tripId: trip._id,
        userId: member._id,
      });
      expect(found).toBeNull();
    });

    it("returns 403 when non-owner tries to remove a member", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser({ email: "ed3@example.com" });
      const viewer = await createTestUser({ email: "vw@example.com" });
      const trip = await seedTrip(owner._id.toString());

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

      await request(app)
        .delete(`/api/v1/trips/${trip._id}/members/${viewer._id}`)
        .set("x-test-clerk-id", editor.clerkId)
        .expect(403);
    });
  });

  // ── POST /api/v1/invites/:token/accept ───────────────────────────────────

  describe("POST /invites/:token/accept", () => {
    it("returns 200 and activates membership", async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser({ email: "api-accept@example.com" });
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "api-accept@example.com", role: "editor" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "api-accept@example.com",
      });

      const res = await request(app)
        .post(`/api/v1/invites/${invite!.token}/accept`)
        .set("x-test-clerk-id", invitee.clerkId)
        .expect(200);

      expect(res.body.data.status).toBe("active");
    });

    it("returns 401 without auth", async () => {
      await request(app).post("/api/v1/invites/some-token/accept").expect(401);
    });
  });

  // ── POST /api/v1/invites/:token/decline ──────────────────────────────────

  describe("POST /invites/:token/decline", () => {
    it("returns 200 and deletes the invite", async () => {
      const owner = await createTestUser();
      const invitee = await createTestUser({
        email: "api-decline@example.com",
      });
      const trip = await seedTrip(owner._id.toString());

      await memberService.inviteMember(
        trip._id.toString(),
        owner._id.toString(),
        { email: "api-decline@example.com", role: "editor" },
      );

      const invite = await PendingInvite.findOne({
        tripId: trip._id,
        email: "api-decline@example.com",
      });

      await request(app)
        .post(`/api/v1/invites/${invite!.token}/decline`)
        .set("x-test-clerk-id", invitee.clerkId)
        .expect(200);

      const remaining = await PendingInvite.findOne({
        tripId: trip._id,
        email: "api-decline@example.com",
      });
      expect(remaining).toBeNull();
    });

    it("returns 401 without auth", async () => {
      await request(app).post("/api/v1/invites/some-token/decline").expect(401);
    });
  });
});
