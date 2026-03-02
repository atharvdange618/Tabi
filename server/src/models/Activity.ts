import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ActivityType } from "../../../shared/types/index.ts";

const activitySchema = new Schema(
  {
    dayId: {
      type: Schema.Types.ObjectId,
      ref: "Day",
      required: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ActivityType),
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    location: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    estimatedCost: {
      type: Number,
    },
    position: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

activitySchema.index({ dayId: 1, position: 1 });
activitySchema.index({ tripId: 1 });

export type ActivityDocument = InferSchemaType<typeof activitySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Activity = mongoose.model("Activity", activitySchema);
