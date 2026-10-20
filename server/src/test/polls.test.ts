/**
 * polls.test.ts
 *
 * Covers vote toggling, switching options, and concurrent votes.
 */

import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => {
    next();
  },
  getAuth: () => ({ userId: null }),
}));

import { User, Poll } from "../models/index.ts";
import * as tripService from "../services/trip.service.ts";
import * as pollService from "../services/poll.service.ts";

async function createTestUser() {
  const uid = new mongoose.Types.ObjectId().toHexString();
  return User.create({
    clerkId: `clerk_${uid}`,
    email: `user_${uid}@example.com`,
    name: "Test User",
  });
}

async function seedPoll() {
  const owner = await createTestUser();
  const trip = await tripService.createTrip(owner._id.toString(), {
    title: "Poll Trip",
    startDate: "2024-05-01T00:00:00.000Z",
    endDate: "2024-05-02T00:00:00.000Z",
  });
  const poll = await pollService.createPoll(
    trip._id.toString(),
    owner._id.toString(),
    { question: "Where to eat?", options: ["Ramen", "Sushi"] },
  );
  const [ramen, sushi] = poll.options.map((o) => o._id.toString());
  return {
    tripId: trip._id.toString(),
    pollId: poll._id.toString(),
    ramen: ramen!,
    sushi: sushi!,
  };
}

function votesFor(
  poll: { options: { _id: unknown; votes: unknown[] }[] } | null,
  optionId: string,
) {
  const option = poll?.options.find((o) => String(o._id) === optionId);
  return (option?.votes ?? []).map(String);
}

describe("votePoll", () => {
  it("should add, switch and remove a vote", async () => {
    const { tripId, pollId, ramen, sushi } = await seedPoll();
    const user = (await createTestUser())._id.toString();

    let poll = await pollService.votePoll(tripId, pollId, user, {
      optionId: ramen,
    });
    expect(votesFor(poll, ramen)).toEqual([user]);

    poll = await pollService.votePoll(tripId, pollId, user, {
      optionId: sushi,
    });
    expect(votesFor(poll, ramen)).toEqual([]);
    expect(votesFor(poll, sushi)).toEqual([user]);

    poll = await pollService.votePoll(tripId, pollId, user, {
      optionId: sushi,
    });
    expect(votesFor(poll, sushi)).toEqual([]);
  });

  it("should keep every vote when members vote at the same time", async () => {
    const { tripId, pollId, ramen } = await seedPoll();
    const users = await Promise.all(
      Array.from({ length: 6 }, () => createTestUser()),
    );

    await Promise.all(
      users.map((u) =>
        pollService.votePoll(tripId, pollId, u._id.toString(), {
          optionId: ramen,
        }),
      ),
    );

    const poll = await Poll.findById(pollId).lean();
    expect(votesFor(poll, ramen)).toHaveLength(6);
  });

  it("should reject votes on a closed poll", async () => {
    const { tripId, pollId, ramen } = await seedPoll();
    await Poll.updateOne({ _id: pollId }, { status: "closed" });
    const user = (await createTestUser())._id.toString();

    await expect(
      pollService.votePoll(tripId, pollId, user, { optionId: ramen }),
    ).rejects.toThrow("Cannot vote on a closed poll");
  });
});

describe("closePoll", () => {
  it("closes an open poll with one of its own options", async () => {
    const { tripId, pollId, sushi } = await seedPoll();

    const poll = await pollService.closePoll(tripId, pollId, {
      winningOptionId: sushi,
    });

    expect(poll.status).toBe("closed");
    expect(String(poll.winningOptionId)).toBe(sushi);
  });

  it("rejects a winning option that is not part of the poll", async () => {
    const { tripId, pollId } = await seedPoll();
    const foreign = new mongoose.Types.ObjectId().toString();

    await expect(
      pollService.closePoll(tripId, pollId, { winningOptionId: foreign }),
    ).rejects.toThrow("Option not found");
    expect((await Poll.findById(pollId).lean())?.status).toBe("open");
  });

  it("rejects closing a poll that is already closed", async () => {
    const { tripId, pollId, ramen, sushi } = await seedPoll();
    await pollService.closePoll(tripId, pollId, { winningOptionId: ramen });

    await expect(
      pollService.closePoll(tripId, pollId, { winningOptionId: sushi }),
    ).rejects.toThrow("already closed");
    const poll = await Poll.findById(pollId).lean();
    expect(String(poll?.winningOptionId)).toBe(ramen);
  });
});
