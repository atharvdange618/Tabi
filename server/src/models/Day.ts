import mongoose, { Schema, type InferSchemaType } from "mongoose";

const daySchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

daySchema.index({ tripId: 1, date: 1 }, { unique: true });

export type DayDocument = InferSchemaType<typeof daySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Day = mongoose.model("Day", daySchema);
