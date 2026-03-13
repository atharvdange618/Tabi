import type { Request, Response } from "express";
import * as pollService from "../services/poll.service.ts";
import type {
  CreatePollPayload,
  VotePollPayload,
  ClosePollPayload,
} from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/polls
 */
export async function getPolls(req: Request, res: Response): Promise<void> {
  const polls = await pollService.getPolls(req.params.id as string);
  res.json({ data: polls });
}

/**
 * POST /api/v1/trips/:id/polls
 */
export async function createPoll(req: Request, res: Response): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }
  const poll = await pollService.createPoll(
    req.params.id as string,
    req.dbUserId,
    req.body as CreatePollPayload,
  );
  res.status(201).json({ data: poll });
}

/**
 * POST /api/v1/trips/:id/polls/:pollId/vote
 */
export async function votePoll(req: Request, res: Response): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }
  const poll = await pollService.votePoll(
    req.params.id as string,
    req.params.pollId as string,
    req.dbUserId,
    req.body as VotePollPayload,
  );
  res.json({ data: poll });
}

/**
 * PATCH /api/v1/trips/:id/polls/:pollId/close
 */
export async function closePoll(req: Request, res: Response): Promise<void> {
  const poll = await pollService.closePoll(
    req.params.id as string,
    req.params.pollId as string,
    req.body as ClosePollPayload,
  );
  res.json({ data: poll });
}

/**
 * DELETE /api/v1/trips/:id/polls/:pollId
 */
export async function deletePoll(req: Request, res: Response): Promise<void> {
  await pollService.deletePoll(
    req.params.id as string,
    req.params.pollId as string,
  );
  res.status(204).send();
}
