import { type Request, type Response } from "express";
import { Webhook } from "svix";
import type { ClerkWebhookEvent } from "../../../shared/types/index.ts";
import {
  processUserCreated,
  processUserUpdated,
} from "../services/webhookService.ts";

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
  const payload =
    req.body instanceof Buffer
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);

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
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook] CLERK_WEBHOOK_SECRET is not set");
    console.log(secret);

    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  let event: ClerkWebhookEvent;

  try {
    event = verifyWebhookSignature(req, secret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  const { type, data } = event;

  try {
    switch (type) {
      case "user.created":
        await processUserCreated(data);
        console.log(`[webhook] user.created → synced user ${data.id}`);
        break;

      case "user.updated":
        await processUserUpdated(data);
        console.log(`[webhook] user.updated → synced user ${data.id}`);
        break;

      default:
        console.log(`[webhook] Unhandled event type: ${type}`);
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[webhook] Failed to process event ${type}:`, err);
    res.status(500).json({ error: "Failed to process webhook event" });
  }
};
