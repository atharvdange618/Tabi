import mongoose from "mongoose";
import streamifier from "streamifier";
import { File } from "../models/index.ts";
import { NotFoundError, ValidationError } from "../lib/errors.ts";
import cloudinary from "../lib/cloudinary.ts";
import type { CloudinaryResourceType } from "../models/File.ts";

export function getResourceType(mimetype: string): CloudinaryResourceType {
  if (mimetype.startsWith("image/")) {
    return "image";
  }
  if (mimetype.startsWith("video/")) {
    return "video";
  }
  return "raw";
}

/**
 * Sanitize a filename for use as a Cloudinary public_id.
 */
export function sanitizePublicId(originalName: string): string {
  return originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 100);
}

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
 * Handles images, and raw files (text, csv, etc.)
 */
export async function uploadFile(
  tripId: string,
  userId: string,
  file: Express.Multer.File,
) {
  if (file.buffer.length === 0) {
    throw new ValidationError("Empty file");
  }

  const resourceType = getResourceType(file.mimetype);

  const publicId =
    resourceType === "raw" ? sanitizePublicId(file.originalname) : undefined;

  const uploadResult = await new Promise<{
    public_id: string;
    secure_url: string;
    bytes: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `tabi/${tripId}`,
        resource_type: resourceType,
        ...(publicId && { public_id: publicId }),
      },
      (error: unknown, result) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error("Cloudinary upload error:", error);
          const errMsg =
            error instanceof Error ? error.message : "Upload failed";
          reject(new Error(errMsg));
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
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

  return File.create({
    tripId: new mongoose.Types.ObjectId(tripId),
    filename: uploadResult.public_id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: uploadResult.bytes,
    cloudinaryId: uploadResult.public_id,
    cloudinaryUrl: uploadResult.secure_url,
    resourceType,
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

  const resourceType = file.resourceType;

  const destroyResult = (await cloudinary.uploader.destroy(file.cloudinaryId, {
    resource_type: resourceType,
  })) as { result: string };

  if (destroyResult.result !== "ok" && destroyResult.result !== "not found") {
    // eslint-disable-next-line no-console
    console.error("Cloudinary destroy failed:", destroyResult);
    throw new Error(`Cloudinary deletion failed: ${destroyResult.result}`);
  }

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
