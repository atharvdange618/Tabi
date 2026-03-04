import { Router } from "express";
import webhookRoutes from "./webhook.ts";
import tripRoutes from "./trips.ts";
import memberRoutes from "./members.ts";
import inviteRoutes from "./invites.ts";
import dayRoutes from "./days.ts";
import activityRoutes from "./activities.ts";

const router = Router();

// Clerk webhook
router.use("/webhooks", webhookRoutes);

// Trip CRUD
router.use("/trips", tripRoutes);

// Member management
router.use("/trips", memberRoutes);

// Invite accept/decline
router.use("/invites", inviteRoutes);

// Days API
router.use("/trips/:id/days", dayRoutes);

// Activities API
router.use("/trips/:id/days/:dayId/activities", activityRoutes);

export { router };
