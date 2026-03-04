import crypto from "node:crypto";
import mongoose from "mongoose";
import { TripMember, PendingInvite, User, Trip } from "../models/index.ts";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.ts";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";
import type {
  InviteMemberPayload,
  UpdateMemberRolePayload,
} from "../../../shared/validations/index.ts";
import { sendInviteEmail } from "../lib/email.ts";

/**
 * Return all members for a trip, with user info populated.
 */
export async function getMembers(tripId: string) {
  return TripMember.find({ tripId })
    .populate("userId", "name email avatarUrl")
    .populate("invitedBy", "name email")
    .lean();
}

/**
 * Invite a user to a trip by email.
 *
 * Two paths:
 *   1. Email belongs to an existing user → create TripMember (pending) + PendingInvite
 *   2. Email is unknown → create PendingInvite only
 *
 * In both cases an invite email is sent.
 */
export async function inviteMember(
  tripId: string,
  inviterUserId: string,
  payload: InviteMemberPayload,
) {
  const email = payload.email.toLowerCase();
  const role = payload.role;

  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) {
    const existingMember = await TripMember.findOne({
      tripId,
      userId: existingUser._id,
    }).lean();

    if (existingMember) {
      if (existingMember.status === TripMemberStatus.ACTIVE) {
        throw new ConflictError(
          "User is already an active member of this trip",
        );
      }
      if (existingMember.status === TripMemberStatus.PENDING) {
        throw new ConflictError("An invite is already pending for this user");
      }
    }
  }

  const existingInvite = await PendingInvite.findOne({ tripId, email }).lean();
  if (existingInvite) {
    throw new ConflictError("An invite is already pending for this email");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (existingUser) {
    await TripMember.create({
      tripId: new mongoose.Types.ObjectId(tripId),
      userId: existingUser._id,
      role,
      status: TripMemberStatus.PENDING,
      invitedBy: new mongoose.Types.ObjectId(inviterUserId),
    });
  }

  const invite = await PendingInvite.create({
    tripId: new mongoose.Types.ObjectId(tripId),
    email,
    role,
    invitedBy: new mongoose.Types.ObjectId(inviterUserId),
    token,
    expiresAt,
  });

  const inviter = await User.findById(inviterUserId).lean();
  const trip = await Trip.findById(tripId).lean();
  const inviterName = inviter?.name ?? "Someone";
  const tripTitle = trip?.title ?? "a trip";
  sendInviteEmail(email, inviterName, tripTitle, token).catch(() => {});

  return invite;
}

/**
 * Accept a pending invite by its token.
 * Creates (or activates) a TripMember and deletes the PendingInvite.
 */
export async function acceptInvite(token: string, acceptingUserId: string) {
  const invite = await PendingInvite.findOne({ token });
  if (!invite) {
    throw new NotFoundError("Invite not found or has expired");
  }

  const user = await User.findById(acceptingUserId).lean();
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new ForbiddenError(
      "This invite was sent to a different email address",
    );
  }

  const existingMember = await TripMember.findOne({
    tripId: invite.tripId,
    userId: acceptingUserId,
  });

  if (existingMember) {
    if (existingMember.status === TripMemberStatus.ACTIVE) {
      await PendingInvite.deleteOne({ _id: invite._id });
      return existingMember;
    }
    existingMember.status = TripMemberStatus.ACTIVE;
    existingMember.joinedAt = new Date();
    await existingMember.save();
    await PendingInvite.deleteOne({ _id: invite._id });
    return existingMember;
  }

  const member = await TripMember.create({
    tripId: invite.tripId,
    userId: new mongoose.Types.ObjectId(acceptingUserId),
    role: invite.role,
    status: TripMemberStatus.ACTIVE,
    invitedBy: invite.invitedBy,
    joinedAt: new Date(),
  });

  await PendingInvite.deleteOne({ _id: invite._id });
  return member;
}

/**
 * Decline a pending invite by its token.
 * Removes the PendingInvite and any pending TripMember.
 */
export async function declineInvite(token: string, decliningUserId: string) {
  const invite = await PendingInvite.findOne({ token });
  if (!invite) {
    throw new NotFoundError("Invite not found or has expired");
  }

  const user = await User.findById(decliningUserId).lean();
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new ForbiddenError(
      "This invite was sent to a different email address",
    );
  }

  await TripMember.deleteOne({
    tripId: invite.tripId,
    userId: decliningUserId,
    status: TripMemberStatus.PENDING,
  });

  await PendingInvite.deleteOne({ _id: invite._id });
}

/**
 * Update a member's role. Owner-only operation.
 * Cannot change own role. Cannot set role to 'owner'.
 */
export async function updateMemberRole(
  tripId: string,
  targetUserId: string,
  payload: UpdateMemberRolePayload,
  requestingUserId: string,
) {
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError("Cannot change your own role");
  }

  if (payload.role === TripMemberRole.OWNER) {
    throw new ValidationError(
      "Cannot assign owner role through this endpoint. Use ownership transfer instead.",
    );
  }

  const member = await TripMember.findOne({
    tripId,
    userId: targetUserId,
    status: TripMemberStatus.ACTIVE,
  });

  if (!member) {
    throw new NotFoundError("Member not found");
  }

  member.role = payload.role;
  await member.save();
  return member;
}

/**
 * Remove a member from a trip. Owner-only operation.
 * Cannot remove self (owner must always exist).
 */
export async function removeMember(
  tripId: string,
  targetUserId: string,
  requestingUserId: string,
) {
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError("Cannot remove yourself from the trip");
  }

  const member = await TripMember.findOne({
    tripId,
    userId: targetUserId,
  });

  if (!member) {
    throw new NotFoundError("Member not found");
  }

  if (member.role === TripMemberRole.OWNER) {
    throw new ForbiddenError("Cannot remove the trip owner");
  }

  await TripMember.deleteOne({ _id: member._id });
}
