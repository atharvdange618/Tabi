import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CLOUDINARY_RESOURCE_TYPES = ["image", "video", "raw"] as const;

const fileSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    cloudinaryId: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: CLOUDINARY_RESOURCE_TYPES,
      required: true,
      default: "image",
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

fileSchema.index({ tripId: 1 });

export type CloudinaryResourceType = (typeof CLOUDINARY_RESOURCE_TYPES)[number];

export type FileDocument = InferSchemaType<typeof fileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const File = mongoose.model("File", fileSchema);
