import { Router } from "express";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from "../../../shared/validations/index.ts";
import * as memberController from "../controllers/member.controller.ts";

const router = Router();

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/members - list all members for a trip
router.get(
  "/:id/members",
  ...auth,
  requireMembership(),
  memberController.getMembers,
);

// POST /api/v1/trips/:id/members/invite - invite a user by email
router.post(
  "/:id/members/invite",
  ...auth,
  requireRole(["owner"]),
  validate(inviteMemberSchema),
  memberController.inviteMember,
);

// POST /api/v1/trips/:id/members/transfer-ownership - transfer ownership to another member
router.post(
  "/:id/members/transfer-ownership",
  ...auth,
  requireRole(["owner"]),
  validate(transferOwnershipSchema),
  memberController.transferOwnership,
);

// POST /api/v1/trips/:id/members/ownership/accept - accept a pending ownership transfer
router.post(
  "/:id/members/ownership/accept",
  ...auth,
  requireMembership(),
  memberController.acceptOwnershipTransfer,
);

// POST /api/v1/trips/:id/members/ownership/decline - decline a pending ownership transfer
router.post(
  "/:id/members/ownership/decline",
  ...auth,
  requireMembership(),
  memberController.declineOwnershipTransfer,
);

// DELETE /api/v1/trips/:id/members/me - leave trip (self-removal)
router.delete(
  "/:id/members/me",
  ...auth,
  requireMembership(),
  memberController.leaveTripSelf,
);

// PATCH /api/v1/trips/:id/members/:uid - update a member's role
router.patch(
  "/:id/members/:uid",
  ...auth,
  requireRole(["owner"]),
  validate(updateMemberRoleSchema),
  memberController.updateMemberRole,
);

// DELETE /api/v1/trips/:id/members/invites/:inviteId - revoke a pending invite (must be before /:uid)
router.delete(
  "/:id/members/invites/:inviteId",
  ...auth,
  requireRole(["owner"]),
  memberController.revokeInvite,
);

// DELETE /api/v1/trips/:id/members/:uid - remove a member
router.delete(
  "/:id/members/:uid",
  ...auth,
  requireRole(["owner"]),
  memberController.removeMember,
);

export default router;
