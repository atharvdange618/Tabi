import mongoose, { Schema, type InferSchemaType } from "mongoose";

const pollOptionSchema = new Schema(
  {
    text: { type: String, required: true, maxlength: 200 },
    votes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: true },
);

const pollSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      maxlength: 500,
    },
    options: {
      type: [pollOptionSchema],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      required: true,
    },
    winningOptionId: {
      type: Schema.Types.ObjectId,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

pollSchema.index({ tripId: 1, createdAt: -1 });

export type PollDocument = InferSchemaType<typeof pollSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Poll = mongoose.model("Poll", pollSchema);
