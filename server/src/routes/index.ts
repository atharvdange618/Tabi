import { Router } from "express";
import webhookRoutes from "./webhook.ts";

const router = Router();

router.use("/webhooks", webhookRoutes);

// Routes will be registered here as features are built
// import tripRoutes from "./trips.ts";
// router.use("/trips", tripRoutes);

export { router };
