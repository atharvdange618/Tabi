import mongoose from "mongoose";
import { File } from "../models/index.ts";
import { NotFoundError, ValidationError } from "../lib/errors.ts";
import cloudinary from "../lib/cloudinary.ts";

/**
 * Get all files for a trip.
 */
export async function getFiles(tripId: string) {
  return File.find({ tripId })
    .populate("uploadedBy", "name avatarUrl")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Upload a file to Cloudinary and save metadata to MongoDB.
 */
export async function uploadFile(
  tripId: string,
  userId: string,
  file: Express.Multer.File,
) {
  if (file.buffer.length === 0) {
    throw new ValidationError("Empty file");
  }

  const uploadResult = await new Promise<{
    public_id: string;
    secure_url: string;
    bytes: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `tabi/${tripId}`,
        resource_type: "auto",
      },
      (error: unknown, result) => {
        if (error) {
          const errMsg = typeof error === "string" ? error : "Upload failed";
          reject(error instanceof Error ? error : new Error(errMsg));
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary returned no result"));
          return;
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          bytes: result.bytes,
        });
      },
    );
    stream.end(file.buffer);
  });

  return File.create({
    tripId: new mongoose.Types.ObjectId(tripId),
    filename: uploadResult.public_id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: uploadResult.bytes,
    cloudinaryId: uploadResult.public_id,
    cloudinaryUrl: uploadResult.secure_url,
    uploadedBy: new mongoose.Types.ObjectId(userId),
  });
}

/**
 * Delete a file from Cloudinary and MongoDB.
 */
export async function deleteFile(tripId: string, fileId: string) {
  const file = await File.findOne({ _id: fileId, tripId });
  if (!file) {
    throw new NotFoundError("File not found");
  }

  await cloudinary.uploader.destroy(file.cloudinaryId);
  await File.deleteOne({ _id: fileId });
}

/**
 * Get the Cloudinary URL for a specific file.
 */
export async function getFileUrl(tripId: string, fileId: string) {
  const file = await File.findOne({ _id: fileId, tripId }).lean();
  if (!file) {
    throw new NotFoundError("File not found");
  }

  return { url: file.cloudinaryUrl };
}
