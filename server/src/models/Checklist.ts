import mongoose, { Schema, type InferSchemaType } from "mongoose";

const checklistSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
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

checklistSchema.index({ tripId: 1, position: 1 });

export type ChecklistDocument = InferSchemaType<typeof checklistSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Checklist = mongoose.model("Checklist", checklistSchema);
