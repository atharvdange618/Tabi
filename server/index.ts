import app from "./src/app.ts";
import { connectDB } from "./src/lib/db.ts";
import logger from "./src/lib/logger.ts";
import { env } from "./src/lib/env.ts";

const PORT = env.PORT;

async function start(): Promise<void> {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        port: PORT,
        env: env.NODE_ENV,
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
