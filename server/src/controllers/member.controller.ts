import type { Request, Response } from "express";
import * as memberService from "../services/member.service.ts";
import type {
  InviteMemberPayload,
  UpdateMemberRolePayload,
} from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/members
 * Return all members for a trip.
 */
export async function getMembers(req: Request, res: Response): Promise<void> {
  const members = await memberService.getMembers(req.params.id as string);
  res.json({ data: members });
}

/**
 * POST /api/v1/trips/:id/members/invite
 * Invite a user to a trip by email.
 */
export async function inviteMember(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const invite = await memberService.inviteMember(
    req.params.id as string,
    userId,
    req.body as InviteMemberPayload,
  );
  res.status(201).json({ data: invite });
}

/**
 * PATCH /api/v1/trips/:id/members/:uid
 * Update a member's role.
 */
export async function updateMemberRole(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const member = await memberService.updateMemberRole(
    req.params.id as string,
    req.params.uid as string,
    req.body as UpdateMemberRolePayload,
    userId,
  );
  res.json({ data: member });
}

/**
 * DELETE /api/v1/trips/:id/members/:uid
 * Remove a member from a trip.
 */
export async function removeMember(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await memberService.removeMember(
    req.params.id as string,
    req.params.uid as string,
    userId,
  );
  res.status(204).send();
}

/**
 * POST /api/v1/invites/:token/accept
 * Accept a pending invite.
 */
export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const member = await memberService.acceptInvite(
    req.params.token as string,
    userId,
  );
  res.json({ data: member });
}

/**
 * POST /api/v1/invites/:token/decline
 * Decline a pending invite.
 */
export async function declineInvite(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await memberService.declineInvite(req.params.token as string, userId);
  res.json({ message: "Invite declined" });
}
