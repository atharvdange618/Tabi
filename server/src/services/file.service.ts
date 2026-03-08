import mongoose from "mongoose";
import { File } from "../models/index.ts";
import {
  LimitExceededError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.ts";
import { LIMITS } from "../../../shared/constants.ts";
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

  const fileCount = await File.countDocuments({ tripId });
  if (fileCount >= LIMITS.FILES_PER_TRIP) {
    throw new LimitExceededError(
      `A trip can have at most ${LIMITS.FILES_PER_TRIP} files (${fileCount}/${LIMITS.FILES_PER_TRIP})`,
    );
  }

  const resourceType = getResourceType(file.mimetype);

  const publicId =
    resourceType === "raw" ? sanitizePublicId(file.originalname) : undefined;

  const dataURI = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(dataURI, {
    folder: `tabi/${tripId}`,
    resource_type: resourceType,
    ...(publicId && { public_id: publicId }),
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
