import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  TripMemberRole,
  TripMemberStatus,
} from "../../../shared/types/index.ts";

const tripMemberSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(TripMemberRole),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(TripMemberStatus),
      default: TripMemberStatus.ACTIVE,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

tripMemberSchema.index({ tripId: 1, userId: 1 }, { unique: true });
tripMemberSchema.index({ userId: 1, status: 1 });

export type TripMemberDocument = InferSchemaType<typeof tripMemberSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TripMember = mongoose.model("TripMember", tripMemberSchema);
