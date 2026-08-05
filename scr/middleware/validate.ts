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

export const validateParams =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid parameters",
        details: z.flattenError(result.error).fieldErrors,
      });
    }

    // Express типізує params як ParamsDictionary (рядки),
    // але після Zod (наприклад z.coerce.number()) тут можуть бути числа.
    // Ми зберігаємо провалідовані значення в req.params і робимо приведення типу.
    req.params = result.data as unknown as typeof req.params;
    next();
  };

export const validateQuery =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: z.flattenError(result.error).fieldErrors,
      });
    }

    // Express типізує req.query як ParsedQs, тому зберігаємо провалідоване в res.locals
    res.locals.query = result.data;
    next();
  };

