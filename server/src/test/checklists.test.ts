/**
 * checklists.test.ts
 *
 * Comprehensive test suite for the Checklists API.
 *
 * Structure:
 *   1. "Checklists" - HTTP integration tests for checklist management
 *      - POST   /api/v1/trips/:id/checklists
 *      - GET    /api/v1/trips/:id/checklists
 *      - PATCH  /api/v1/trips/:id/checklists/:clId
 *      - DELETE /api/v1/trips/:id/checklists/:clId
 *
 *   2. "Checklist Items" - HTTP integration tests for item management
 *      - POST   /api/v1/trips/:id/checklists/:clId/items
 *      - PATCH  /api/v1/trips/:id/checklists/:clId/items/:itemId
 *      - DELETE /api/v1/trips/:id/checklists/:clId/items/:itemId
 *
 * Covers: auto-position assignment, nested item retrieval, cascade deletes,
 * check/uncheck toggling with checkedBy/checkedAt metadata, and viewer role enforcement.
 *
 * Auth strategy: same Clerk mock as trips.test.ts.
 *
 * Note: I have used AI to generate these tests based on the requirements and my
 * knowledge of the codebase, but I have personally reviewed and edited each test
 * case to ensure accuracy and relevance. The AI assisted in creating a comprehensive
 * set of scenarios, including edge cases, to thoroughly validate the Checklists CRUD functionality.
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
import { User, TripMember, Checklist, ChecklistItem } from "../models/index.ts";
import * as tripService from "../services/trip.service.ts";
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
    endDate: "2024-05-03T00:00:00.000Z",
  } as any);
}

describe("Checklists API", () => {
  it("should create a checklist and auto-assign position", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    // First checklist
    const res1 = await request(app)
      .post(`/api/v1/trips/${trip._id}/checklists`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ title: "Packing List" })
      .expect(201);

    expect(res1.body.data.title).toBe("Packing List");
    expect(res1.body.data.position).toBe(1024);

    // Second checklist
    const res2 = await request(app)
      .post(`/api/v1/trips/${trip._id}/checklists`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ title: "To-Do before leaving" })
      .expect(201);

    expect(res2.body.data.position).toBe(2048);
  });

  it("should list checklists with nested items", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    const checklist = await Checklist.create({
      tripId: trip._id,
      title: "Groceries",
      position: 1024,
      createdBy: owner._id,
    });

    await ChecklistItem.create({
      checklistId: checklist._id,
      label: "Milk",
      position: 1024,
    });

    await ChecklistItem.create({
      checklistId: checklist._id,
      label: "Eggs",
      position: 2048,
    });

    const res = await request(app)
      .get(`/api/v1/trips/${trip._id}/checklists`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Groceries");
    expect(res.body.data[0].items).toHaveLength(2);
    expect(res.body.data[0].items[0].label).toBe("Milk");
  });

  it("should update a checklist title", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    const checklist = await Checklist.create({
      tripId: trip._id,
      title: "Old Title",
      position: 1024,
      createdBy: owner._id,
    });

    const res = await request(app)
      .patch(`/api/v1/trips/${trip._id}/checklists/${checklist._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ title: "New Title" })
      .expect(200);

    expect(res.body.data.title).toBe("New Title");
  });

  it("should cascade-delete items when a checklist is deleted", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    const checklist = await Checklist.create({
      tripId: trip._id,
      title: "To Delete",
      position: 1024,
      createdBy: owner._id,
    });

    const item = await ChecklistItem.create({
      checklistId: checklist._id,
      label: "Item to delete",
      position: 1024,
    });

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/checklists/${checklist._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(204);

    const deletedCl = await Checklist.findById(checklist._id);
    const deletedItem = await ChecklistItem.findById(item._id);

    expect(deletedCl).toBeNull();
    expect(deletedItem).toBeNull();
  });

  it("should deny a viewer from creating a checklist", async () => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
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
      .post(`/api/v1/trips/${trip._id}/checklists`)
      .set("x-test-clerk-id", viewer.clerkId)
      .send({ title: "Hacked List" })
      .expect(403);
  });

  describe("Checklist Items", () => {
    it("should create a checklist item", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const checklist = await Checklist.create({
        tripId: trip._id,
        title: "List",
        position: 1024,
        createdBy: owner._id,
      });

      const res = await request(app)
        .post(`/api/v1/trips/${trip._id}/checklists/${checklist._id}/items`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ label: "New Item" })
        .expect(201);

      expect(res.body.data.label).toBe("New Item");
      expect(res.body.data.isChecked).toBe(false);
    });

    it("should toggle item check and set checkedBy/checkedAt", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const checklist = await Checklist.create({
        tripId: trip._id,
        title: "List",
        position: 1024,
        createdBy: owner._id,
      });

      const item = await ChecklistItem.create({
        checklistId: checklist._id,
        label: "Item",
        position: 1024,
      });

      const res = await request(app)
        .patch(
          `/api/v1/trips/${trip._id}/checklists/${checklist._id}/items/${item._id}`,
        )
        .set("x-test-clerk-id", owner.clerkId)
        .send({ isChecked: true })
        .expect(200);

      expect(res.body.data.isChecked).toBe(true);
      expect(res.body.data.checkedBy).toBe(owner._id.toString());
      expect(res.body.data.checkedAt).toBeDefined();

      // Uncheck
      const resUncheck = await request(app)
        .patch(
          `/api/v1/trips/${trip._id}/checklists/${checklist._id}/items/${item._id}`,
        )
        .set("x-test-clerk-id", owner.clerkId)
        .send({ isChecked: false })
        .expect(200);

      expect(resUncheck.body.data.isChecked).toBe(false);
      expect(resUncheck.body.data.checkedBy).toBeNull();
      expect(resUncheck.body.data.checkedAt).toBeNull();
    });

    it("should delete an item", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const checklist = await Checklist.create({
        tripId: trip._id,
        title: "List",
        position: 1024,
        createdBy: owner._id,
      });

      const item = await ChecklistItem.create({
        checklistId: checklist._id,
        label: "Item",
        position: 1024,
      });

      await request(app)
        .delete(
          `/api/v1/trips/${trip._id}/checklists/${checklist._id}/items/${item._id}`,
        )
        .set("x-test-clerk-id", owner.clerkId)
        .expect(204);

      const deleted = await ChecklistItem.findById(item._id);
      expect(deleted).toBeNull();
    });
  });
});
