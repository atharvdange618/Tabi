import { getFullName, getPrimaryEmail } from "../lib/helpers.ts";
import { User } from "../models/User.ts";

export const processUserCreated = async (data: any): Promise<void> => {
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

export const processUserUpdated = async (data: any): Promise<void> => {
  const email = getPrimaryEmail(data);
  const name = getFullName(data);

  const updated = await User.findOneAndUpdate(
    { clerkId: data.id },
    {
      $set: {
        email,
        name,
        avatarUrl: data.image_url ?? "",
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    await User.create({
      clerkId: data.id,
      email,
      name,
      avatarUrl: data.image_url ?? "",
    });
  }
};
