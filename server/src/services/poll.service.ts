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
  const tripObjectId = new mongoose.Types.ObjectId(tripId);
  const pollObjectId = new mongoose.Types.ObjectId(pollId);
  const optionObjectId = new mongoose.Types.ObjectId(payload.optionId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const votesWithoutUser = {
    $filter: {
      input: "$$o.votes",
      as: "v",
      cond: { $ne: ["$$v", userObjectId] },
    },
  };

  // One pipeline update so concurrent voters can't overwrite each other:
  // strip the user's vote from every option, then add it to the target
  // unless they were already voting for it (toggle off).
  const updated = await Poll.findOneAndUpdate(
    {
      _id: pollObjectId,
      tripId: tripObjectId,
      status: "open",
      "options._id": optionObjectId,
    },
    [
      {
        $set: {
          options: {
            $map: {
              input: "$options",
              as: "o",
              in: {
                $mergeObjects: [
                  "$$o",
                  {
                    votes: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$$o._id", optionObjectId] },
                            { $not: { $in: [userObjectId, "$$o.votes"] } },
                          ],
                        },
                        { $concatArrays: [votesWithoutUser, [userObjectId]] },
                        votesWithoutUser,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ],
    { returnDocument: "after", updatePipeline: true },
  ).lean();

  if (updated) {
    return updated;
  }
  return explainPollUpdateMiss(
    tripObjectId,
    pollObjectId,
    "Cannot vote on a closed poll",
  );
}

/**
 * Called when a guarded poll update matched nothing: throws the error that
 * says why (missing poll, closed poll, or unknown option).
 */
async function explainPollUpdateMiss(
  tripId: mongoose.Types.ObjectId,
  pollId: mongoose.Types.ObjectId,
  closedMessage: string,
): Promise<never> {
  const poll = await Poll.findOne({ _id: pollId, tripId })
    .select("status")
    .lean();
  if (!poll) {
    throw new NotFoundError("Poll not found");
  }
  if (poll.status === "closed") {
    throw new ValidationError(closedMessage);
  }
  throw new NotFoundError("Option not found");
}

/**
 * Close a poll and declare a winning option.
 */
export async function closePoll(
  tripId: string,
  pollId: string,
  payload: ClosePollPayload,
) {
  const tripObjectId = new mongoose.Types.ObjectId(tripId);
  const pollObjectId = new mongoose.Types.ObjectId(pollId);
  const winningOptionId = new mongoose.Types.ObjectId(payload.winningOptionId);

  const poll = await Poll.findOneAndUpdate(
    {
      _id: pollObjectId,
      tripId: tripObjectId,
      status: "open",
      "options._id": winningOptionId,
    },
    { $set: { status: "closed", winningOptionId } },
    { returnDocument: "after" },
  ).lean();

  if (poll) {
    return poll;
  }
  return explainPollUpdateMiss(
    tripObjectId,
    pollObjectId,
    "Poll is already closed",
  );
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
