import { Router } from "express";
import webhookRoutes from "./webhook.ts";
import tripRoutes from "./trips.ts";

const router = Router();

// Clerk webhook — no auth middleware
router.use("/webhooks", webhookRoutes);

// Trip CRUD
router.use("/trips", tripRoutes);

export { router };
