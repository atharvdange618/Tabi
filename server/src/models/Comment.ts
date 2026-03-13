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
    reactions: {
      type: [
        {
          emoji: { type: String, required: true, maxlength: 10 },
          users: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
      ],
      default: [],
      validate: {
        validator: (arr: { emoji: string; users: unknown[] }[]) =>
          arr.length <= 6,
        message: "A comment can have at most 6 different reaction types",
      },
    },
  },
  { timestamps: true },
);

commentSchema.index({ tripId: 1, targetType: 1, targetId: 1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment = mongoose.model("Comment", commentSchema);
