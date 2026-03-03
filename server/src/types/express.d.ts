import type { TripMemberDocument } from "../models/TripMember.ts";

declare global {
  namespace Express {
    interface Request {
      dbUserId?: string;
      member?: TripMemberDocument;
    }
  }
}
