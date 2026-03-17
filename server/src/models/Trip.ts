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
    destination: {
      type: String,
      default: "",
      maxlength: 200,
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
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator (tags: string[]) {
          if (tags.length > 10) {
            return false;
          }
          return tags.every((tag) => tag.length <= 20 && tag.length > 0);
        },
        message: "Tags must be maximum 10 items, each with 1-20 characters",
      },
    },
  },
  { timestamps: true },
);

tripSchema.index({ createdBy: 1 });
tripSchema.index({ isPublic: 1, createdAt: -1 });
tripSchema.index({ isPublic: 1, destination: 1 });
tripSchema.index({ isPublic: 1, tags: 1 });

export type TripDocument = InferSchemaType<typeof tripSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Trip = mongoose.model("Trip", tripSchema);
