import { getFullName, getPrimaryEmail } from "../lib/helpers.ts";
import { User } from "../models/User.ts";
import type { ClerkUserPayload } from "../../../shared/types/index.ts";

export const processUserCreated = async (
  data: ClerkUserPayload,
): Promise<void> => {
  const email = getPrimaryEmail(data);
  const name = getFullName(data);

  await User.findOneAndUpdate(
    { clerkId: data.id },
    {
      $setOnInsert: { clerkId: data.id },
      $set: {
        email,
        name,
        avatarUrl: data.image_url ?? "",
      },
    },
    { upsert: true, returnDocument: "after" },
  );
};

export const processUserUpdated = async (
  data: ClerkUserPayload,
): Promise<void> => {
  const email = getPrimaryEmail(data);
  const name = getFullName(data);

  await User.findOneAndUpdate(
    { clerkId: data.id },
    {
      $set: {
        email,
        name,
        avatarUrl: data.image_url ?? "",
      },
      $setOnInsert: { clerkId: data.id },
    },
    { upsert: true, returnDocument: "after" },
  );
};
