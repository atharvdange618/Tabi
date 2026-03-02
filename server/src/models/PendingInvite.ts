import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { TripMemberRole } from "../../../shared/types/index.ts";

const INVITE_ROLES = [TripMemberRole.EDITOR, TripMemberRole.VIEWER] as const;

const pendingInviteSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      enum: INVITE_ROLES,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

pendingInviteSchema.index({ tripId: 1, email: 1 }, { unique: true });
pendingInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PendingInviteDocument = InferSchemaType<
  typeof pendingInviteSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const PendingInvite = mongoose.model(
  "PendingInvite",
  pendingInviteSchema,
);
