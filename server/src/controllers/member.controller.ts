import type { Request, Response } from "express";
import * as memberService from "../services/member.service.ts";
import type {
  InviteMemberPayload,
  UpdateMemberRolePayload,
  TransferOwnershipPayload,
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
 * DELETE /api/v1/trips/:id/members/invites/:inviteId
 * Revoke (cancel) a pending invite. Owner only.
 */
export async function revokeInvite(req: Request, res: Response): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await memberService.revokeInvite(
    req.params.id as string,
    req.params.inviteId as string,
    userId,
  );
  res.status(204).send();
}

/**
 * GET /api/v1/invites/:token
 * Return a lightweight preview of a pending invite.
 */
export async function getInvitePreview(
  req: Request,
  res: Response,
): Promise<void> {
  const preview = await memberService.getInvitePreview(
    req.params.token as string,
  );
  res.json({ data: preview });
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

/**
 * POST /api/v1/trips/:id/members/transfer-ownership
 * Transfer ownership to another active member.
 */
export async function transferOwnership(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { targetUserId } = req.body as TransferOwnershipPayload;

  const members = await memberService.transferOwnership(
    req.params.id as string,
    userId,
    targetUserId,
  );

  res.json({ data: members, message: "Ownership transferred successfully" });
}

/**
 * DELETE /api/v1/trips/:id/members/me
 * Leave a trip (self-removal).
 */
export async function leaveTripSelf(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.dbUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await memberService.leaveTripSelf(req.params.id as string, userId);

  res.json({ message: "Successfully left the trip" });
}
