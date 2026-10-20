/* eslint-disable no-console -- one-off migration script */
/**
 * Give every expense created before `splitAmong` existed a snapshot of the
 * members who had joined by the time it was created. Safe to re-run: it only
 * touches expenses that still lack the field.
 *
 *   pnpm backfill:splits
 */
import mongoose from "mongoose";
import { backfillSplitAmong } from "../src/services/budget.service.ts";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

await mongoose.connect(uri);
const updated = await backfillSplitAmong();
console.log(`Backfilled splitAmong on ${updated} expense(s)`);
await mongoose.disconnect();
