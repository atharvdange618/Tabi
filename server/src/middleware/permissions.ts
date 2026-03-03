import type { Request, Response, NextFunction } from "express";
import { TripMember } from "../models/index.ts";
import { TripMemberStatus } from "../../../shared/types/index.ts";

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

export function requireMembership() {
  return requireRole(["owner", "editor", "viewer"]);
}
