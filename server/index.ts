import app from "./src/app.ts";
import { connectDB } from "./src/lib/db.ts";
import logger from "./src/lib/logger.ts";

const PORT = process.env.PORT || 8000;

const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_WEBHOOK_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function checkEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error("Missing required environment variables — aborting startup", {
      missing,
    });
    process.exit(1);
  }

  logger.info("Environment variables loaded", {
    vars: REQUIRED_ENV_VARS,
  });
}

async function start(): Promise<void> {
  try {
    checkEnv();
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV ?? "development",
      });
    });
  } catch (error) {
    logger.error("Failed to start server", {
      err: error,
    });
    process.exit(1);
  }
}

start();
