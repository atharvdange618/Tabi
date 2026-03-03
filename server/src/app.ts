import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import { router } from "./routes/index.ts";

const app = express();

app.use(helmet());
app.use(hpp());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use("/api/v1/webhooks", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", router);

export default app;
