import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Zod validation middleware factory.
 * Validates req.body against the provided schema.
 * Returns 400 with flattened errors on failure.
 *
 * Usage: router.post("/", validate(createTripSchema), controller.create)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }

    req.body = result.data;
    next();
  };
}
