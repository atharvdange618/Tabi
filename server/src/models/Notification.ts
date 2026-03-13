import mongoose, { Schema, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "ownership_transferred",
        "member_left",
        "member_invited",
        "comment_created",
        "expense_added",
        "role_changed",
        "activity_updated",
        "reservation_added",
        "trip_updated",
        "poll_created",
      ],
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7776000,
    },
  },
  { timestamps: false },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ tripId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, tripId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<
  typeof notificationSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification = mongoose.model("Notification", notificationSchema);
