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

// Mock Cloudinary
vi.mock("../lib/cloudinary.ts", () => {
  return {
    default: {
      uploader: {
        upload_stream: vi.fn().mockImplementation((_opts, cb) => {
          // Fake a stream that instantly triggers callback
          cb(null, {
            public_id: "fake_public_id",
            secure_url: "https://fake-cloudinary.com/fake_id.png",
            bytes: 1024,
          });
          return { end: vi.fn(), on: vi.fn() };
        }),
        destroy: vi.fn().mockResolvedValue({ result: "ok" }),
      },
    },
  };
});

import app from "../app.ts";
import { User, TripMember, File } from "../models/index.ts";
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

describe("Files API", () => {
  it("should get files for a trip", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    await File.create({
      tripId: trip._id,
      filename: "test.pdf",
      originalName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: 5000,
      cloudinaryId: "cl_123",
      cloudinaryUrl: "https://...",
      uploadedBy: owner._id,
    });

    const res = await request(app)
      .get(`/api/v1/trips/${trip._id}/files`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].originalName).toBe("test.pdf");
    expect(res.body.data[0].uploadedBy._id).toBe(owner._id.toString());
  });

  it("should return validation error when uploading without file", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    await request(app)
      .post(`/api/v1/trips/${trip._id}/files`)
      .set("x-test-clerk-id", owner.clerkId)
      // No file attached
      .expect(400); // Because of ValidationError
  });

  it("should return 404 when deleting non-existent file", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());
    const fakeFileId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/files/${fakeFileId}`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(404);
  });

  it("should deny a viewer from deleting a file", async () => {
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

    const file = await File.create({
      tripId: trip._id,
      filename: "test.pdf",
      originalName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: 5000,
      cloudinaryId: "cl_123",
      cloudinaryUrl: "https://...",
      uploadedBy: owner._id,
    });

    await request(app)
      .delete(`/api/v1/trips/${trip._id}/files/${file._id}`)
      .set("x-test-clerk-id", viewer.clerkId)
      .expect(404);
  });

  it("should successfully upload a mock file and save metadata", async () => {
    const owner = await createTestUser();
    const trip = await seedTrip(owner._id.toString());

    // We can simulate an upload by sending a raw buffer via supertest
    const res = await request(app)
      .post(`/api/v1/trips/${trip._id}/files`)
      .set("x-test-clerk-id", owner.clerkId)
      .attach("file", Buffer.from("mock file content"), "test-upload.pdf")
      .expect(201);

    expect(res.body.data.originalName).toBe("test-upload.pdf");
    expect(res.body.data.cloudinaryId).toBe("fake_public_id");

    // Test URL retrieval
    const urlRes = await request(app)
      .get(`/api/v1/trips/${trip._id}/files/${res.body.data._id}/url`)
      .set("x-test-clerk-id", owner.clerkId)
      .expect(200);

    expect(urlRes.body.data.url).toBe(
      "https://fake-cloudinary.com/fake_id.png",
    );
  });
});
