import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/index.ts";

/**
 * Clerk middleware that attaches auth info to every request.
 */
export const clerkAuth = clerkMiddleware();

/**
 * Require authentication on a route.
 * Returns 401 if the user is not authenticated.
 */
export const requireAuthentication = requireAuth();

/**
 * After Clerk auth, need to resolve the user's internal
 * MongoDB _id from their clerkId. This middleware attaches it
 * as req.dbUserId for downstream use.
 *
 * Usage: router.use(requireAuthentication, resolveDbUser)
 */
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
