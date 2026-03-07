import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_URL: z.url().default("http://localhost:3000"),

  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1, "CLERK_WEBHOOK_SECRET is required"),

  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME is required")
    .transform((s) => s.trim()),
  CLOUDINARY_API_KEY: z
    .string()
    .min(1, "CLOUDINARY_API_KEY is required")
    .transform((s) => s.trim()),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET is required")
    .transform((s) => s.trim()),

  RESEND_API_KEY: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

type EnvSchema = z.infer<typeof envSchema>;

/**
 * In test mode, we bypass strict startup validation because tools like
 * mongodb-memory-server inject MONGODB_URI dynamically after the file load.
 */
const isTestMode =
  process.env.NODE_ENV === "test" || process.env.VITEST === "true";

let _env: EnvSchema | undefined;

if (!isTestMode) {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(
      "❌ Invalid environment variables:",
      z.treeifyError(parsed.error),
    );
    process.exit(1);
  }

  _env = parsed.data;
} else {
  _env = new Proxy({} as EnvSchema, {
    get(_target, prop: string) {
      if (process.env[prop] !== undefined) {
        return process.env[prop];
      }

      if (prop === "NODE_ENV") {
        return "test";
      }
      if (prop === "PORT") {
        return 8000;
      }
      if (prop === "CLIENT_URL") {
        return "http://localhost:3000";
      }

      return undefined;
    },
  });
}

export const env = _env;
