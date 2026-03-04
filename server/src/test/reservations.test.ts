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
import { User, TripMember, Reservation } from "../models/index.ts";
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

describe("Reservations API", () => {
  it("should create a reservation", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    const res = await request(app)
      .post(`/api/v1/trips/${trip._id}/reservations`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({
        type: "flight",
        title: "Flight to Tokyo",
        provider: "ANA",
        confirmationNumber: "XYZ123",
      })
      .expect(201);

    expect(res.body.data.title).toBe("Flight to Tokyo");
    expect(res.body.data.type).toBe("flight");
  });

  it("should get reservations for a trip", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    await Reservation.create({
      tripId: trip._id,
      type: "hotel",
      title: "Hotel Stay",
      createdBy: owner._id,
    });

    const res = await request(app)
      .get(`/api/v1/trips/${trip._id}/reservations`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Hotel Stay");
    expect(res.body.data[0].type).toBe("hotel");
  });

  it("should update a reservation", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    const reservation = await Reservation.create({
      tripId: trip._id,
      type: "flight",
      title: "Delta Flight",
      createdBy: owner._id,
    });

    const res = await request(app)
      .patch(`/api/v1/trips/${trip._id}/reservations/${reservation._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ title: "JAL Flight" })
      .expect(200);

    expect(res.body.data.title).toBe("JAL Flight");
  });

  it("should delete a reservation", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    const reservation = await Reservation.create({
      tripId: trip._id,
      type: "flight",
      title: "To Delete",
      createdBy: owner._id,
    });

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/reservations/${reservation._id}`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(204);

    const deleted = await Reservation.findById(reservation._id);
    expect(deleted).toBeNull();
  });

  it("should return validation error for missing title", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    await request(app)
      .post(`/api/v1/trips/${trip._id}/reservations`)
      .set("x-test-clerk-id", owner.clerkId)
      .send({ type: "flight" }) // Missing title
      .expect(400);
  });

  it("should deny a viewer from creating a reservation", async () => {
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
      .post(`/api/v1/trips/${trip._id}/reservations`)
      .set("x-test-clerk-id", viewer.clerkId)
      .send({ title: "Hacked Hotel", type: "hotel" })
      .expect(404);
  });
});
