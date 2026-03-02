import mongoose, { Schema, type InferSchemaType } from "mongoose";

const checklistItemSchema = new Schema(
  {
    checklistId: {
      type: Schema.Types.ObjectId,
      ref: "Checklist",
      required: true,
    },
    label: {
      type: String,
      required: true,
      maxlength: 200,
    },
    isChecked: {
      type: Boolean,
      default: false,
    },
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    checkedAt: {
      type: Date,
      default: null,
    },
    position: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

checklistItemSchema.index({ checklistId: 1, position: 1 });

export type ChecklistItemDocument = InferSchemaType<
  typeof checklistItemSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const ChecklistItem = mongoose.model(
  "ChecklistItem",
  checklistItemSchema,
);
