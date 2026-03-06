import mongoose, { Schema, type InferSchemaType } from "mongoose";

const settlementSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

settlementSchema.index({ tripId: 1 });
settlementSchema.index({ tripId: 1, fromUserId: 1, toUserId: 1 });

export type SettlementDocument = InferSchemaType<typeof settlementSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Settlement = mongoose.model("Settlement", settlementSchema);
