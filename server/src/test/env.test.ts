import { describe, it, expect } from "vitest";
import { envSchema } from "../lib/env.ts";

const validEnv = {
  MONGODB_URI: "mongodb://localhost:27017/tabi",
  CLERK_SECRET_KEY: "sk_test_x",
  CLERK_PUBLISHABLE_KEY: "pk_test_x",
  CLERK_WEBHOOK_SECRET: "whsec_x",
  CLOUDINARY_CLOUD_NAME: "cloud",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
};

describe("envSchema CLERK_PUBLISHABLE_KEY", () => {
  it("accepts a set key", () => {
    expect(envSchema.safeParse(validEnv).success).toBe(true);
  });

  it("rejects a missing key", () => {
    const { CLERK_PUBLISHABLE_KEY: _omit, ...env } = validEnv;
    expect(envSchema.safeParse(env).success).toBe(false);
  });

  it("rejects an empty key", () => {
    const result = envSchema.safeParse({ ...validEnv, CLERK_PUBLISHABLE_KEY: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "CLERK_PUBLISHABLE_KEY is required",
    );
  });
});
