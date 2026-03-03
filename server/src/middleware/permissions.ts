import type { Request, Response, NextFunction } from "express";
import { TripMember } from "../models/index.ts";
import { TripMemberStatus } from "../../../shared/types/index.ts";

/**
 * Role-based permission middleware.
 * Checks if the authenticated user has one of the required roles
 * for the given trip.
 *
 * Usage: router.patch("/:id", requireRole(["owner"]), controller.update)
 *
 * Returns 404 (not 403) to avoid leaking trip existence per PRD security rules.
 */
export function requireRole(allowedRoles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id: tripId } = req.params;
      const { dbUserId } = req;

      if (!tripId || !dbUserId) {
        res.status(401).json({ error: "Unauthenticated or missing trip ID" });
        return;
      }

      const member = await TripMember.findOne({
        tripId,
        userId: dbUserId,
        status: TripMemberStatus.ACTIVE,
        role: { $in: allowedRoles },
      });

      if (!member) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }

      req.member = member;
      next();
    } catch (error) {
      if (error instanceof Error && error.name === "CastError") {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      next(error);
    }
  };
}

/**
 * Verify the user is a member of the trip (any role).
 * Returns 404 if not a member.
 */
export function requireMembership() {
  return requireRole(["owner", "editor", "viewer"]);
}
