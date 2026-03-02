import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tripSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    travelerCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    coverImageUrl: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

tripSchema.index({ createdBy: 1 });

export type TripDocument = InferSchemaType<typeof tripSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Trip = mongoose.model("Trip", tripSchema);
