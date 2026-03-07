import { clerkMiddleware, clerkClient, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/index.ts";
import logger from "../lib/logger.ts";
import { env } from "../lib/env.ts";

const isDev = env.NODE_ENV !== "production";

export const clerkAuth = clerkMiddleware();

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);

  if (!auth.userId) {
    const clerkStatus = res.getHeader("x-clerk-auth-status") as
      | string
      | undefined;
    const clerkReason = res.getHeader("x-clerk-auth-reason") as
      | string
      | undefined;

    logger.warn("Authentication failed", {
      url: req.originalUrl,
      clerkStatus: clerkStatus ?? "unknown",
      clerkReason: clerkReason ?? "unknown",
      hasAuthHeader: !!req.headers.authorization,
    });

    res.status(401).json({
      error: "Unauthenticated",
      ...(isDev && { reason: clerkReason ?? "no active session" }),
    });
    return;
  }

  next();
}

export async function resolveDbUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = getAuth(req);
    const clerkId = auth.userId;

    if (!clerkId) {
      res.status(401).json({ error: "Missing Clerk user ID" });
      return;
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      );
      const email =
        primaryEmail?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        "";
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        "Unknown";

      try {
        user = await User.findOneAndUpdate(
          { clerkId },
          {
            $setOnInsert: { clerkId },
            $set: { email, name, avatarUrl: clerkUser.imageUrl },
          },
          { upsert: true, returnDocument: "after" },
        );
      } catch (err) {
        const mongoErr = err as { code?: number };
        if (mongoErr.code === 11000) {
          user = await User.findOneAndUpdate(
            { email },
            { $set: { clerkId, name, avatarUrl: clerkUser.imageUrl } },
            { returnDocument: "after" },
          );
          logger.warn("resolveDbUser - JIT sync: merged duplicate email doc", {
            clerkId,
            email,
          });
        } else {
          throw err;
        }
      }

      logger.info("resolveDbUser - JIT sync: user created from Clerk", {
        clerkId,
      });
    }

    if (!user) {
      res.status(500).json({ error: "Failed to resolve user" });
      return;
    }

    req.dbUserId = user._id.toString();
    next();
  } catch (error) {
    next(error);
  }
}
