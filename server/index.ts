import app from "./src/app.ts";
import { connectDB } from "./src/lib/db.ts";

const PORT = process.env.PORT || 8000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[server] Failed to start:", error);
    process.exit(1);
  }
}

start();
