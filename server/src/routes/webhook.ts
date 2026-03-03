import { Router } from "express";
import { handleClerkWebhook } from "../controllers/webhookController.ts";

const router = Router();

router.post("/clerk", handleClerkWebhook);

export default router;
