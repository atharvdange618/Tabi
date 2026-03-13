import mongoose from "mongoose";
import { Poll, Trip } from "../models/index.ts";
import { NotFoundError, ValidationError } from "../lib/errors.ts";
import {
  notificationEvents,
  NotificationEvents,
} from "../lib/notificationEmitter.ts";
import type {
  CreatePollPayload,
  VotePollPayload,
  ClosePollPayload,
} from "../../../shared/validations/index.ts";
import logger from "../lib/logger.ts";

/**
 * Retrieve all polls for a trip, newest first.
 */
export async function getPolls(tripId: string) {
  return Poll.find({ tripId: new mongoose.Types.ObjectId(tripId) })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Create a new poll for a trip.
 */
export async function createPoll(
  tripId: string,
  userId: string,
  payload: CreatePollPayload,
) {
  const poll = await Poll.create({
    tripId: new mongoose.Types.ObjectId(tripId),
    question: payload.question,
    options: payload.options.map((text) => ({ text, votes: [] })),
    status: "open",
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  try {
    const trip = await Trip.findById(tripId).lean();
    if (trip) {
      notificationEvents.emit(NotificationEvents.POLL_CREATED, {
        tripId,
        tripTitle: trip.title,
        pollId: poll._id.toString(),
        createdByUserId: userId,
        question: payload.question,
      });
    }
  } catch (error) {
    logger.error("Failed to emit poll created event", {
      error,
      pollId: poll._id,
    });
  }

  return poll;
}

/**
 * Toggle a user's vote on a poll option.
 * A user can only vote for one option at a time; voting for the same
 * option again removes their vote (toggle off).
 */
export async function votePoll(
  tripId: string,
  pollId: string,
  userId: string,
  payload: VotePollPayload,
) {
  const poll = await Poll.findOne({
    _id: new mongoose.Types.ObjectId(pollId),
    tripId: new mongoose.Types.ObjectId(tripId),
  }).lean();

  if (!poll) { throw new NotFoundError("Poll not found"); }
  if (poll.status === "closed") {
    throw new ValidationError("Cannot vote on a closed poll");
  }

  interface OptionLean {
    _id: mongoose.Types.ObjectId;
    text: string;
    votes: mongoose.Types.ObjectId[];
  }

  const options = poll.options as OptionLean[];
  const targetIdx = options.findIndex(
    (o) => o._id.toString() === payload.optionId,
  );
  if (targetIdx === -1) { throw new NotFoundError("Option not found"); }

  const wasVotingForThis = options[targetIdx]?.votes.some(
    (v) => v.toString() === userId,
  ) ?? false;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Build new options: strip user's vote from all, then conditionally add to target
  const newOptions = options.map((o) => ({
    _id: o._id,
    text: o.text,
    votes: o.votes.filter((v) => v.toString() !== userId),
  }));

  if (!wasVotingForThis) {
    newOptions[targetIdx]?.votes.push(userObjectId);
  }

  const updated = await Poll.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(pollId),
      tripId: new mongoose.Types.ObjectId(tripId),
    },
    { $set: { options: newOptions } },
    { new: true },
  ).lean();

  return updated;
}

/**
 * Close a poll and declare a winning option.
 */
export async function closePoll(
  tripId: string,
  pollId: string,
  payload: ClosePollPayload,
) {
  const poll = await Poll.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(pollId),
      tripId: new mongoose.Types.ObjectId(tripId),
    },
    {
      $set: {
        status: "closed",
        winningOptionId: new mongoose.Types.ObjectId(payload.winningOptionId),
      },
    },
    { new: true },
  ).lean();

  if (!poll) { throw new NotFoundError("Poll not found"); }
  return poll;
}

/**
 * Delete a poll.
 */
export async function deletePoll(tripId: string, pollId: string) {
  const result = await Poll.deleteOne({
    _id: new mongoose.Types.ObjectId(pollId),
    tripId: new mongoose.Types.ObjectId(tripId),
  });
  if (result.deletedCount === 0) { throw new NotFoundError("Poll not found"); }
}
