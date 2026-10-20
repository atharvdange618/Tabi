import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../lib/errors.ts";
import logger from "../lib/logger.ts";
import { env } from "../lib/env.ts";

/**
 * Centralized Express error-handling middleware.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    logger.warn(err.message, {
      context: "errorHandler",
      statusCode: err.statusCode,
      name: err.name,
    });

    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const message =
      Object.values(err.errors)[0]?.message ?? "Validation failed";
    logger.warn(message, { context: "errorHandler", name: err.name });

    res.status(400).json({ error: message });
    return;
  }

  // BSONError: `new ObjectId(...)` was given a malformed ID string.
  if (err.name === "CastError" || err.name === "BSONError") {
    logger.warn("Invalid ID format", {
      context: "errorHandler",
      originalMessage: err.message,
    });

    res.status(400).json({ error: "Invalid ID format" });
    return;
  }

  logger.error(err.message || "Unhandled server error", {
    context: "errorHandler",
    err,
    stack: err.stack,
  });

  const isDev = env.NODE_ENV === "development";
  res.status(500).json({
    error: isDev && err.message ? err.message : "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
};
