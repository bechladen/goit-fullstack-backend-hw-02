import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateBody =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const flattened = z.flattenError(result.error);
      return res.status(422).json({
        error: "Validation failed",
        details:
          Object.keys(flattened.fieldErrors).length > 0
            ? flattened.fieldErrors
            : flattened.formErrors,
      });
    }
    req.body = result.data;
    next();
  };

