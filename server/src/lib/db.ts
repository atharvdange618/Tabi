import mongoose, { ConnectionStates } from "mongoose";
import logger from "./logger.ts";
import { env } from "./env.ts";

export async function connectDB(): Promise<void> {
  const MONGODB_URI = env.MONGODB_URI;

  if (mongoose.connection.readyState >= ConnectionStates.connected) {
    return;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection failed", { err: error });
    throw error;
  }

  mongoose.connection.on("error", (err: unknown) => {
    logger.error("MongoDB connection error", { err });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}
