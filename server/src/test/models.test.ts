import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";
import {
  User,
  Trip,
  TripMember,
  PendingInvite,
  Day,
  Activity,
  Comment,
  Checklist,
  ChecklistItem,
  File,
  Reservation,
  BudgetSettings,
  Expense,
} from "../models/index.ts";

describe("Mongoose Models", () => {
  const models = [
    { name: "User", model: User },
    { name: "Trip", model: Trip },
    { name: "TripMember", model: TripMember },
    { name: "PendingInvite", model: PendingInvite },
    { name: "Day", model: Day },
    { name: "Activity", model: Activity },
    { name: "Comment", model: Comment },
    { name: "Checklist", model: Checklist },
    { name: "ChecklistItem", model: ChecklistItem },
    { name: "File", model: File },
    { name: "Reservation", model: Reservation },
    { name: "BudgetSettings", model: BudgetSettings },
    { name: "Expense", model: Expense },
  ];

  it("should have all 13 models registered", () => {
    expect(models).toHaveLength(13);
    for (const { name, model } of models) {
      expect(model.modelName).toBe(name);
    }
  });

  it("should have correct indexes on User", () => {
    const indexes = User.schema.indexes();
    const indexFields = indexes.map(([fields]) => Object.keys(fields));
    expect(indexFields).toContainEqual(["clerkId"]);
    expect(indexFields).toContainEqual(["email"]);
  });

  it("should have correct indexes on TripMember", () => {
    const indexes = TripMember.schema.indexes();
    const indexFields = indexes.map(([fields]) => Object.keys(fields));
    expect(indexFields).toContainEqual(["tripId", "userId"]);
    expect(indexFields).toContainEqual(["userId", "status"]);
  });

  it("should have TTL index on PendingInvite.expiresAt", () => {
    const indexes = PendingInvite.schema.indexes();
    const ttlIndex = indexes.find(([fields]) =>
      Object.keys(fields).includes("expiresAt"),
    );
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex![1]).toHaveProperty("expireAfterSeconds", 0);
  });

  it("should have unique compound index on Day (tripId, date)", () => {
    const indexes = Day.schema.indexes();
    const dayIndex = indexes.find(
      ([fields]) =>
        Object.keys(fields).includes("tripId") &&
        Object.keys(fields).includes("date"),
    );
    expect(dayIndex).toBeDefined();
    expect(dayIndex![1]).toHaveProperty("unique", true);
  });

  it("should have compound indexes on Expense", () => {
    const indexes = Expense.schema.indexes();
    const indexFields = indexes.map(([fields]) => Object.keys(fields));
    expect(indexFields).toContainEqual(["tripId", "category"]);
    expect(indexFields).toContainEqual(["tripId", "paidBy"]);
  });

  it("should enforce required fields on Trip", async () => {
    const trip = new Trip({});
    const err = trip.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors).toHaveProperty("title");
    expect(err!.errors).toHaveProperty("startDate");
    expect(err!.errors).toHaveProperty("endDate");
    expect(err!.errors).toHaveProperty("createdBy");
  });

  it("should enforce maxlength on Trip.title", async () => {
    const trip = new Trip({
      title: "a".repeat(101),
      startDate: new Date(),
      endDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });
    const err = trip.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors).toHaveProperty("title");
  });

  it("should default Trip.travelerCount to 1", () => {
    const trip = new Trip({
      title: "Test",
      startDate: new Date(),
      endDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });
    expect(trip.travelerCount).toBe(1);
  });

  it("should default TripMember.status to active", () => {
    const member = new TripMember({
      tripId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      role: TripMemberRole.EDITOR,
      invitedBy: new mongoose.Types.ObjectId(),
    });
    expect(member.status).toBe(TripMemberStatus.ACTIVE);
  });

  it("should lowercase PendingInvite.email", () => {
    const invite = new PendingInvite({
      tripId: new mongoose.Types.ObjectId(),
      email: "Test@Example.COM",
      role: TripMemberRole.EDITOR,
      invitedBy: new mongoose.Types.ObjectId(),
      token: "abc123",
      expiresAt: new Date(),
    });
    expect(invite.email).toBe("test@example.com");
  });

  it("should reject 'owner' as PendingInvite.role", () => {
    const invite = new PendingInvite({
      tripId: new mongoose.Types.ObjectId(),
      email: "test@test.com",
      role: TripMemberRole.OWNER,
      invitedBy: new mongoose.Types.ObjectId(),
      token: "abc",
      expiresAt: new Date(),
    });
    const err = invite.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors).toHaveProperty("role");
  });

  it("should default Comment.isEdited to false", () => {
    const comment = new Comment({
      tripId: new mongoose.Types.ObjectId(),
      targetType: "day",
      targetId: new mongoose.Types.ObjectId(),
      body: "test",
      authorId: new mongoose.Types.ObjectId(),
    });
    expect(comment.isEdited).toBe(false);
  });

  it("should default BudgetSettings.currency to 'INR'", () => {
    const settings = new BudgetSettings({
      tripId: new mongoose.Types.ObjectId(),
      totalBudget: 50000,
    });
    expect(settings.currency).toBe("INR");
  });
});
