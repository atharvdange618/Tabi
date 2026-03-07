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
import { User, TripMember, BudgetSettings, Expense } from "../models/index.ts";
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
    title: "Budget Test Trip",
    startDate: "2024-06-01T00:00:00.000Z",
    endDate: "2024-06-10T00:00:00.000Z",
  } as any);
}

describe("Budget API", () => {
  // ----------------------------------------------------------------
  // Settings
  // ----------------------------------------------------------------

  describe("GET /budget/settings", () => {
    it("should return null when no settings have been configured", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(res.body.data).toBeNull();
    });

    it("should return existing budget settings", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await BudgetSettings.create({
        tripId: trip._id,
        totalBudget: 50000,
      });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(res.body.data.totalBudget).toBe(50000);
    });

    it("should deny unauthenticated access", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/settings`)
        .expect(401);
    });

    it("should deny a non-member from reading settings", async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", stranger.clerkId)
        .expect(403);
    });
  });

  describe("PUT /budget/settings", () => {
    it("should create budget settings when none exist (upsert)", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .put(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ totalBudget: 100000 })
        .expect(200);

      expect(res.body.data.totalBudget).toBe(100000);
    });

    it("should update existing budget settings (upsert)", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await BudgetSettings.create({
        tripId: trip._id,
        totalBudget: 50000,
      });

      const res = await request(app)
        .put(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ totalBudget: 80000 })
        .expect(200);

      expect(res.body.data.totalBudget).toBe(80000);

      // Confirm only one document exists after multiple upserts
      const count = await BudgetSettings.countDocuments({ tripId: trip._id });
      expect(count).toBe(1);
    });

    it("should return 400 for a negative totalBudget", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .put(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ totalBudget: -5000 })
        .expect(400);
    });

    it("should return 400 when totalBudget is missing", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .put(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({})
        .expect(400);
    });

    it("should deny a viewer from updating budget settings", async () => {
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
        .put(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", viewer.clerkId)
        .send({ totalBudget: 99999 })
        .expect(403);
    });

    it("should allow an editor to update budget settings", async () => {
      const owner = await createTestUser();
      const editor = await createTestUser();
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
        .put(`/api/v1/trips/${trip._id}/budget/settings`)
        .set("x-test-clerk-id", editor.clerkId)
        .send({ totalBudget: 30000 })
        .expect(200);

      expect(res.body.data.totalBudget).toBe(30000);
    });
  });

  // ----------------------------------------------------------------
  // Expenses
  // ----------------------------------------------------------------

  describe("GET /budget/expenses", () => {
    it("should return an empty array when no expenses exist", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it("should return all expenses for a trip sorted newest-first", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await Expense.create({
        tripId: trip._id,
        description: "Hotel stay",
        amount: 2500,
        category: "accommodation",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await Expense.create({
        tripId: trip._id,
        description: "Dinner",
        amount: 450,
        category: "food",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      // Newest first: "Dinner" was created after "Hotel stay"
      expect(res.body.data[0].description).toBe("Dinner");
      expect(res.body.data[1].description).toBe("Hotel stay");
    });

    it("should allow a viewer to list expenses", async () => {
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

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", viewer.clerkId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /budget/expenses", () => {
    it("should create a new expense", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .post(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({
          description: "Flight tickets",
          amount: 6000,
          category: "transport",
          paidBy: owner._id.toString(),
          date: "2024-06-01T08:00:00.000Z",
        })
        .expect(201);

      expect(res.body.data.description).toBe("Flight tickets");
      expect(res.body.data.amount).toBe(6000);
      expect(res.body.data.category).toBe("transport");
    });

    it("should create an expense without the optional date", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .post(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({
          description: "Museum entry",
          amount: 150,
          category: "activities",
          paidBy: owner._id.toString(),
        })
        .expect(201);

      expect(res.body.data.description).toBe("Museum entry");
      expect(res.body.data.amount).toBe(150);
    });

    it("should return 400 when description is missing", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .post(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({
          amount: 1000,
          category: "food",
          paidBy: owner._id.toString(),
        })
        .expect(400);
    });

    it("should return 400 when amount is zero or negative", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .post(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({
          description: "Bad expense",
          amount: 0,
          category: "misc",
          paidBy: owner._id.toString(),
        })
        .expect(400);
    });

    it("should return 400 for an invalid category", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .post(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({
          description: "Invalid category",
          amount: 500,
          category: "vacation", // not a valid enum value
          paidBy: owner._id.toString(),
        })
        .expect(400);
    });

    it("should deny a viewer from creating an expense", async () => {
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
        .post(`/api/v1/trips/${trip._id}/budget/expenses`)
        .set("x-test-clerk-id", viewer.clerkId)
        .send({
          description: "Hacked expense",
          amount: 1,
          category: "misc",
          paidBy: viewer._id.toString(),
        })
        .expect(403);
    });
  });

  describe("PATCH /budget/expenses/:expId", () => {
    it("should update an expense's description and amount", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const expense = await Expense.create({
        tripId: trip._id,
        description: "Old description",
        amount: 1000,
        category: "food",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}/budget/expenses/${expense._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ description: "Updated description", amount: 1200 })
        .expect(200);

      expect(res.body.data.description).toBe("Updated description");
      expect(res.body.data.amount).toBe(1200);
    });

    it("should do a partial update (only category)", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const expense = await Expense.create({
        tripId: trip._id,
        description: "Taxi ride",
        amount: 300,
        category: "transport",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}/budget/expenses/${expense._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ category: "misc" })
        .expect(200);

      expect(res.body.data.category).toBe("misc");
      expect(res.body.data.description).toBe("Taxi ride");
    });

    it("should return 404 for a non-existent expense", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());
      const fakeId = new mongoose.Types.ObjectId().toHexString();

      await request(app)
        .patch(`/api/v1/trips/${trip._id}/budget/expenses/${fakeId}`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ amount: 999 })
        .expect(404);
    });

    it("should return 400 for an invalid amount in patch", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const expense = await Expense.create({
        tripId: trip._id,
        description: "Snacks",
        amount: 100,
        category: "food",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await request(app)
        .patch(`/api/v1/trips/${trip._id}/budget/expenses/${expense._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .send({ amount: -50 })
        .expect(400);
    });

    it("should deny a viewer from patching an expense", async () => {
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

      const expense = await Expense.create({
        tripId: trip._id,
        description: "Guarded expense",
        amount: 500,
        category: "shopping",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await request(app)
        .patch(`/api/v1/trips/${trip._id}/budget/expenses/${expense._id}`)
        .set("x-test-clerk-id", viewer.clerkId)
        .send({ amount: 9999 })
        .expect(403);
    });
  });

  describe("DELETE /budget/expenses/:expId", () => {
    it("should delete an expense", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const expense = await Expense.create({
        tripId: trip._id,
        description: "To be deleted",
        amount: 750,
        category: "misc",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await request(app)
        .delete(`/api/v1/trips/${trip._id}/budget/expenses/${expense._id}`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(204);

      const deleted = await Expense.findById(expense._id);
      expect(deleted).toBeNull();
    });

    it("should return 404 when deleting a non-existent expense", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());
      const fakeId = new mongoose.Types.ObjectId().toHexString();

      await request(app)
        .delete(`/api/v1/trips/${trip._id}/budget/expenses/${fakeId}`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(404);
    });

    it("should deny a viewer from deleting an expense", async () => {
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

      const expense = await Expense.create({
        tripId: trip._id,
        description: "Protected",
        amount: 200,
        category: "food",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await request(app)
        .delete(`/api/v1/trips/${trip._id}/budget/expenses/${expense._id}`)
        .set("x-test-clerk-id", viewer.clerkId)
        .expect(403);

      // Expense should still exist
      const still = await Expense.findById(expense._id);
      expect(still).not.toBeNull();
    });
  });

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------

  describe("GET /budget/summary", () => {
    it("should return zeroed-out summary when no settings or expenses exist", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/summary`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(res.body.data.totalBudget).toBe(0);
      expect(res.body.data.totalSpent).toBe(0);
      expect(res.body.data.remaining).toBe(0);
      expect(res.body.data.currency).toBe("INR");
      expect(res.body.data.byCategory).toEqual({});
    });

    it("should correctly compute totalSpent and remaining", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await BudgetSettings.create({ tripId: trip._id, totalBudget: 10000 });

      await Expense.create({
        tripId: trip._id,
        description: "Hotel",
        amount: 3000,
        category: "accommodation",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await Expense.create({
        tripId: trip._id,
        description: "Food",
        amount: 1500,
        category: "food",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/summary`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(res.body.data.totalBudget).toBe(10000);
      expect(res.body.data.totalSpent).toBe(4500);
      expect(res.body.data.remaining).toBe(5500);
      expect(res.body.data.currency).toBe("INR");
    });

    it("should correctly aggregate byCategory", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await BudgetSettings.create({ tripId: trip._id, totalBudget: 50000 });

      await Expense.create({
        tripId: trip._id,
        description: "Lunch",
        amount: 200,
        category: "food",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await Expense.create({
        tripId: trip._id,
        description: "Dinner",
        amount: 400,
        category: "food",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await Expense.create({
        tripId: trip._id,
        description: "Bus ticket",
        amount: 100,
        category: "transport",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      await Expense.create({
        tripId: trip._id,
        description: "Souvenir",
        amount: 250,
        category: "shopping",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/summary`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      const { byCategory, totalSpent } = res.body.data;

      expect(byCategory.food).toBe(600);
      expect(byCategory.transport).toBe(100);
      expect(byCategory.shopping).toBe(250);
      expect(totalSpent).toBe(950);
    });

    it("should reflect a negative remaining when over-budget", async () => {
      const owner = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await BudgetSettings.create({ tripId: trip._id, totalBudget: 1000 });

      await Expense.create({
        tripId: trip._id,
        description: "Expensive item",
        amount: 2000,
        category: "misc",
        paidBy: owner._id,
        createdBy: owner._id,
      });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/summary`)
        .set("x-test-clerk-id", owner.clerkId)
        .expect(200);

      expect(res.body.data.remaining).toBe(-1000);
    });

    it("should allow a viewer to read the summary", async () => {
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

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/summary`)
        .set("x-test-clerk-id", viewer.clerkId)
        .expect(200);

      expect(res.body.data).toHaveProperty("totalBudget");
      expect(res.body.data).toHaveProperty("totalSpent");
      expect(res.body.data).toHaveProperty("remaining");
      expect(res.body.data).toHaveProperty("byCategory");
      expect(res.body.data.currency).toBe("INR");
    });

    it("should deny a non-member from reading the summary", async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const trip = await seedTrip(owner._id.toString());

      await request(app)
        .get(`/api/v1/trips/${trip._id}/budget/summary`)
        .set("x-test-clerk-id", stranger.clerkId)
        .expect(403);
    });
  });
});
