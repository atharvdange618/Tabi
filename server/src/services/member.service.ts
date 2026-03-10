import crypto from "node:crypto";
import mongoose from "mongoose";
import { TripMember, PendingInvite, User, Trip } from "../models/index.ts";
import {
  ConflictError,
  ForbiddenError,
  LimitExceededError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";
import type {
  InviteMemberPayload,
  UpdateMemberRolePayload,
} from "../../../shared/validations/index.ts";
import { sendInviteEmail } from "../lib/email.ts";
import logger from "../lib/logger.ts";
import {
  notificationEvents,
  NotificationEvents,
} from "../lib/notificationEmitter.ts";

/**
 * Return all members for a trip, with user info populated.
 * Also returns pending invites for unregistered users formatted as members.
 */
export async function getMembers(tripId: string) {
  const [members, pendingInvites] = await Promise.all([
    TripMember.find({ tripId })
      .populate("userId", "name email avatarUrl")
      .populate("invitedBy", "name email")
      .lean(),
    PendingInvite.find({ tripId }).populate("invitedBy", "name email").lean(),
  ]);

  const memberEmails = new Set(
    members
      .map((m) => (m.userId as unknown as { email?: string }).email)
      .filter(Boolean),
  );

  const formattedInvites = pendingInvites
    .filter((invite) => !memberEmails.has(invite.email))
    .map((invite) => ({
      _id: invite._id,
      tripId: invite.tripId,
      userId: null,
      email: invite.email,
      role: invite.role,
      status: TripMemberStatus.PENDING,
      invitedBy: invite.invitedBy,
      createdAt: invite.createdAt,
    }));

  return [...members, ...formattedInvites];
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

  const [memberCount, pendingInviteCount] = await Promise.all([
    TripMember.countDocuments({ tripId }),
    PendingInvite.countDocuments({ tripId }),
  ]);
  const totalOccupied = memberCount + pendingInviteCount;
  if (totalOccupied >= LIMITS.MEMBERS_PER_TRIP) {
    throw new LimitExceededError(
      `A trip can have at most ${LIMITS.MEMBERS_PER_TRIP} members (${totalOccupied}/${LIMITS.MEMBERS_PER_TRIP})`,
    );
  }

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
      throw new ConflictError("An invite is already pending for this user");
    }
  }

  const existingInvite = await PendingInvite.findOne({ tripId, email }).lean();
  if (existingInvite) {
    throw new ConflictError("An invite is already pending for this email");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (existingUser) {
      await TripMember.create(
        [
          {
            tripId: new mongoose.Types.ObjectId(tripId),
            userId: existingUser._id,
            role,
            status: TripMemberStatus.PENDING,
            invitedBy: new mongoose.Types.ObjectId(inviterUserId),
          },
        ],
        { session },
      );
    }

    const invite = await PendingInvite.create(
      [
        {
          tripId: new mongoose.Types.ObjectId(tripId),
          email,
          role,
          invitedBy: new mongoose.Types.ObjectId(inviterUserId),
          token,
          expiresAt,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    const inviter = await User.findById(inviterUserId).lean();
    const trip = await Trip.findById(tripId).lean();
    const inviterName = inviter?.name ?? "Someone";
    const tripTitle = trip?.title ?? "a trip";
    void sendInviteEmail(email, inviterName, tripTitle, token).catch(
      (err: unknown) => {
        logger.error("Invite email failed", {
          email: email.replace(/(.{2}).+(@.+)/, "$1***$2"),
          inviterName,
          tripTitle,
          err,
        });
      },
    );

    return invite[0];
  } catch (error: unknown) {
    await session.abortTransaction();
    throw error;
  } finally {
    void session.endSession();
  }
}

/**
 * Accept a pending invite by its token.
 * Creates (or activates) a TripMember and deletes the PendingInvite.
 */
export async function acceptInvite(token: string, acceptingUserId: string) {
  const invite = await PendingInvite.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
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
  const invite = await PendingInvite.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
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
 * Return a lightweight preview of a pending invite.
 * Does NOT consume or modify the invite.
 */
export async function getInvitePreview(token: string) {
  const invite = await PendingInvite.findOne({
    token,
    expiresAt: { $gt: new Date() },
  })
    .populate<{ invitedBy: { name?: string; email?: string } | null }>(
      "invitedBy",
      "name email",
    )
    .lean();

  if (!invite) {
    throw new NotFoundError("Invite not found or has expired");
  }

  const trip = await Trip.findById(invite.tripId)
    .select("title destination")
    .lean();

  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  return {
    tripName: trip.title,
    tripDestination: trip.destination || null,
    invitedByName:
      invite.invitedBy?.name ?? invite.invitedBy?.email ?? "Someone",
    invitedEmail: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
  };
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

  const requestingMember = await TripMember.findOne({
    tripId,
    userId: requestingUserId,
    status: TripMemberStatus.ACTIVE,
  });

  if (!requestingMember) {
    throw new ForbiddenError(
      "Requesting user is not an active member of the trip",
    );
  }

  if (requestingMember.role !== TripMemberRole.OWNER) {
    throw new ForbiddenError("Only the trip owner can modify member roles");
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

  const requestingMember = await TripMember.findOne({
    tripId,
    userId: requestingUserId,
    status: TripMemberStatus.ACTIVE,
  });

  if (!requestingMember) {
    throw new ForbiddenError("Requesting user is not a member of the trip");
  }

  if (requestingMember.role !== TripMemberRole.OWNER) {
    throw new ForbiddenError("Only the trip owner can remove members");
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

/**
 * Revoke a pending invite by its ID. Owner-only operation.
 */
export async function revokeInvite(
  tripId: string,
  id: string,
  requestingUserId: string,
) {
  const requestingMember = await TripMember.findOne({
    tripId,
    userId: requestingUserId,
    status: TripMemberStatus.ACTIVE,
  });

  if (!requestingMember || requestingMember.role !== TripMemberRole.OWNER) {
    throw new ForbiddenError("Only the trip owner can revoke invitations");
  }

  let invite = await PendingInvite.findOne({ _id: id, tripId });

  if (!invite) {
    const pendingMember = await TripMember.findOne({
      _id: id,
      tripId,
      status: TripMemberStatus.PENDING,
    }).populate<{ userId: { email?: string } }>("userId", "email");

    if (!pendingMember) {
      throw new NotFoundError("Invite not found");
    }

    const email = (pendingMember.userId as { email?: string }).email;
    if (email) {
      invite = await PendingInvite.findOne({ tripId, email });
    }

    await TripMember.deleteOne({ _id: pendingMember._id });
  }

  if (invite) {
    const invitedUser = await User.findOne({ email: invite.email }).lean();
    if (invitedUser) {
      await TripMember.deleteOne({
        tripId,
        userId: invitedUser._id,
        status: TripMemberStatus.PENDING,
      });
    }
    await PendingInvite.deleteOne({ _id: invite._id });
  }
}

/**
 * Transfer trip ownership from current owner to another active member.
 * Uses Mongoose transaction to ensure atomicity.
 * Emits ownership.transferred event for notification system.
 */
export async function transferOwnership(
  tripId: string,
  currentOwnerId: string,
  targetUserId: string,
) {
  const currentOwner = await TripMember.findOne({
    tripId: new mongoose.Types.ObjectId(tripId),
    userId: new mongoose.Types.ObjectId(currentOwnerId),
    status: TripMemberStatus.ACTIVE,
  });

  if (!currentOwner || currentOwner.role !== TripMemberRole.OWNER) {
    throw new ForbiddenError("Only the trip owner can transfer ownership");
  }

  const targetMember = await TripMember.findOne({
    tripId: new mongoose.Types.ObjectId(tripId),
    userId: new mongoose.Types.ObjectId(targetUserId),
    status: TripMemberStatus.ACTIVE,
  });

  if (!targetMember) {
    throw new NotFoundError("Target user is not an active member of this trip");
  }

  if (targetMember.status === TripMemberStatus.PENDING) {
    throw new ValidationError("Cannot transfer ownership to a pending member");
  }

  if (targetMember.role === TripMemberRole.OWNER) {
    throw new ValidationError("Target user is already the owner");
  }

  const trip = await Trip.findById(tripId).select("title").lean();
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await TripMember.updateOne(
        { _id: currentOwner._id },
        { $set: { role: TripMemberRole.EDITOR } },
        { session },
      );

      await TripMember.updateOne(
        { _id: targetMember._id },
        { $set: { role: TripMemberRole.OWNER } },
        { session },
      );
    });

    notificationEvents.emit(NotificationEvents.OWNERSHIP_TRANSFERRED, {
      tripId,
      tripTitle: trip.title,
      oldOwnerId: currentOwnerId,
      newOwnerId: targetUserId,
      actorId: currentOwnerId,
    });

    logger.info("Ownership transferred successfully", {
      tripId,
      oldOwnerId: currentOwnerId,
      newOwnerId: targetUserId,
    });

    return await getMembers(tripId);
  } catch (error) {
    logger.error("Failed to transfer ownership", { error, tripId });
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Allow a member to leave a trip (self-removal).
 * Owner cannot leave without transferring ownership first.
 * Emits member.left event for notification system.
 */
export async function leaveTripSelf(tripId: string, userId: string) {
  const member = await TripMember.findOne({
    tripId: new mongoose.Types.ObjectId(tripId),
    userId: new mongoose.Types.ObjectId(userId),
    status: TripMemberStatus.ACTIVE,
  });

  if (!member) {
    throw new NotFoundError("You are not a member of this trip");
  }

  if (member.role === TripMemberRole.OWNER) {
    throw new ForbiddenError(
      "Trip owner must transfer ownership before leaving",
    );
  }

  const [trip, user] = await Promise.all([
    Trip.findById(tripId).select("title").lean(),
    User.findById(userId).select("name").lean(),
  ]);

  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  if (!user) {
    throw new NotFoundError("User not found");
  }

  await TripMember.deleteOne({ _id: member._id });

  notificationEvents.emit(NotificationEvents.MEMBER_LEFT, {
    tripId,
    tripTitle: trip.title,
    userId,
    userName: user.name,
  });

  logger.info("Member left trip successfully", { tripId, userId });
}
