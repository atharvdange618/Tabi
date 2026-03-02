import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("[db] Connected to MongoDB");
  } catch (error) {
    console.error("[db] Connection failed:", error);
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });
}
