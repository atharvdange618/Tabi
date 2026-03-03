import { Router } from "express";
import { handleClerkWebhook } from "../controllers/clerk-webhook.controller.ts";

const router = Router();

router.post("/clerk", handleClerkWebhook);

export default router;
