import type { Request, Response, NextFunction } from "express";
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

  if (err.name === "CastError") {
    logger.warn("Invalid ID format", {
      context: "errorHandler",
      originalMessage: err.message,
    });

    res.status(400).json({ error: "Invalid ID format" });
    return;
  }

  logger.error("Unhandled server error", {
    context: "errorHandler",
    err,
    stack: err.stack,
  });

  res.status(500).json({
    error: "Internal server error",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
