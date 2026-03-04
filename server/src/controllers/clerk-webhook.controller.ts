import { type Request, type Response } from "express";
import { Webhook } from "svix";
import type { ClerkWebhookEvent } from "../../../shared/types/index.ts";
import {
  processUserCreated,
  processUserUpdated,
} from "../services/clerk-webhook.service.ts";
import logger from "../lib/logger.ts";
import { env } from "../lib/env.ts";

const verifyWebhookSignature = (
  req: Request,
  secret: string,
): ClerkWebhookEvent => {
  const svixId = req.headers["svix-id"];
  const svixTimestamp = req.headers["svix-timestamp"];
  const svixSignature = req.headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing svix headers");
  }

  const wh = new Webhook(secret);
  if (!(req.body instanceof Buffer)) {
    throw new Error(
      "Request body must be raw Buffer for signature verification",
    );
  }
  const payload = req.body.toString("utf8");

  return wh.verify(payload, {
    "svix-id": svixId as string,
    "svix-timestamp": svixTimestamp as string,
    "svix-signature": svixSignature as string,
  }) as ClerkWebhookEvent;
};

export const handleClerkWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const secret = env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    logger.error("CLERK_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  let event: ClerkWebhookEvent;

  try {
    event = verifyWebhookSignature(req, secret);
  } catch (err) {
    logger.warn("Webhook signature verification failed", {
      err,
    });
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  const { type, data } = event;

  try {
    switch (type) {
      case "user.created":
        await processUserCreated(data);
        logger.info("user.created — synced user", {
          clerkId: data.id,
        });
        break;

      case "user.updated":
        await processUserUpdated(data);
        logger.info("user.updated — synced user", {
          clerkId: data.id,
        });
        break;

      default:
        logger.debug("Unhandled webhook event type", {
          type,
        });
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error("Failed to process webhook event", {
      type,
      err,
    });
    res.status(500).json({ error: "Failed to process webhook event" });
  }
};
