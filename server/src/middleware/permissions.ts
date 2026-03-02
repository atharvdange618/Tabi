import type { Request, Response, NextFunction } from "express";

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
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // TODO: Implement once TripMember model exists
    // const member = await TripMemberModel.findOne({
    //   tripId: req.params.id,
    //   userId: req.dbUserId,
    //   status: "active",
    //   role: { $in: allowedRoles },
    // });
    //
    // if (!member) {
    //   res.status(404).json({ error: "Trip not found" });
    //   return;
    // }
    //
    // req.member = member;

    // Temporary pass-through until models are built
    void allowedRoles;
    next();
  };
}

/**
 * Verify the user is a member of the trip (any role).
 * Returns 404 if not a member.
 */
export function requireMembership() {
  return requireRole(["owner", "editor", "viewer"]);
}
