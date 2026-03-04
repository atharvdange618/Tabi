import { Router } from "express";
import * as fileController from "../controllers/file.controller.ts";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { upload } from "../middleware/upload.ts";

const router = Router({ mergeParams: true });

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/files
router.get("/", ...auth, requireMembership(), fileController.getFiles);

// POST /api/v1/trips/:id/files
router.post(
  "/",
  ...auth,
  requireRole(["owner", "editor"]),
  upload.single("file"),
  fileController.uploadFile,
);

// DELETE /api/v1/trips/:id/files/:fileId
router.delete(
  "/:fileId",
  ...auth,
  requireRole(["owner", "editor"]),
  fileController.deleteFile,
);

// GET /api/v1/trips/:id/files/:fileId/url
router.get(
  "/:fileId/url",
  ...auth,
  requireMembership(),
  fileController.getFileUrl,
);

export default router;
