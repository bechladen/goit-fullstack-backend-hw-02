import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}

export default function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    throw createHttpError(401, "Authentication required");
  }

  const token = auth.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as jwt.JwtPayload;
    next();
  } catch {
    throw createHttpError(401, "Invalid or expired token");
  }
}

