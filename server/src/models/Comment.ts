import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { CommentTargetType } from "../../../shared/types/index.ts";

const commentSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: Object.values(CommentTargetType),
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

commentSchema.index({ tripId: 1, targetType: 1, targetId: 1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment = mongoose.model("Comment", commentSchema);
