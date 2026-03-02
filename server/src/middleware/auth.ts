import { clerkMiddleware, requireAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

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
 * This will be implemented once the User model is created.
 */
export async function resolveDbUser(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  // TODO: Look up user by clerkId and attach req.dbUserId
  // const user = await UserModel.findOne({ clerkId: req.auth.userId });
  // if (!user) return res.status(401).json({ error: "User not synced" });
  // req.dbUserId = user._id.toString();
  next();
}
