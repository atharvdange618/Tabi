import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ReservationType } from "../../../shared/types/index.ts";

const reservationSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ReservationType),
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    confirmationNumber: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "",
    },
    datetime: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

reservationSchema.index({ tripId: 1 });

export type ReservationDocument = InferSchemaType<typeof reservationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Reservation = mongoose.model("Reservation", reservationSchema);
