import type { Request, Response } from "express";
import * as fileService from "../services/file.service.ts";
import { ValidationError } from "../lib/errors.ts";

/**
 * GET /api/v1/trips/:id/files
 * List all files for a trip.
 */
export async function getFiles(req: Request, res: Response): Promise<void> {
  const files = await fileService.getFiles(req.params.id as string);
  res.json({ data: files });
}

/**
 * POST /api/v1/trips/:id/files
 * Upload a file (multipart form-data).
 */
export async function uploadFile(req: Request, res: Response): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  if (!req.file) {
    throw new ValidationError("No file provided");
  }

  const file = await fileService.uploadFile(
    req.params.id as string,
    req.dbUserId,
    req.file,
  );
  res.status(201).json({ data: file });
}

/**
 * DELETE /api/v1/trips/:id/files/:fileId
 * Delete a file from Cloudinary and the database.
 */
export async function deleteFile(req: Request, res: Response): Promise<void> {
  await fileService.deleteFile(
    req.params.id as string,
    req.params.fileId as string,
  );
  res.status(204).send();
}

/**
 * GET /api/v1/trips/:id/files/:fileId/url
 * Get the download URL for a specific file.
 */
export async function getFileUrl(req: Request, res: Response): Promise<void> {
  const result = await fileService.getFileUrl(
    req.params.id as string,
    req.params.fileId as string,
  );
  res.json({ data: result });
}
