import { Router } from "express";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import * as memberController from "../controllers/member.controller.ts";

const router = Router();

const auth = [requireAuthentication, resolveDbUser] as const;

// POST /api/v1/invites/:token/accept — accept a pending invite
router.post("/:token/accept", ...auth, memberController.acceptInvite);

// POST /api/v1/invites/:token/decline — decline a pending invite
router.post("/:token/decline", ...auth, memberController.declineInvite);

export default router;
