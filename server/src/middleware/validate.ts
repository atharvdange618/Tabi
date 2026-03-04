import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ error: z.treeifyError(result.error) });
      return;
    }

    req.body = result.data;
    next();
  };
}
