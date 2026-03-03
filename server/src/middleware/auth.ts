import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/index.ts";

export const clerkAuth = clerkMiddleware();

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ error: "Unauthenticated" });
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

    const user = await User.findOne({ clerkId });
    if (!user) {
      res.status(401).json({ error: "User not synced yet" });
      return;
    }

    req.dbUserId = user._id.toString();
    next();
  } catch (error) {
    next(error);
  }
}
