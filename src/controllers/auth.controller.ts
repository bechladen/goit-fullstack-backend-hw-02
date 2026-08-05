import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

import prisma from "../../prisma/client.ts";
import {
  ACCESS_TOKEN_LIFETIME_SECONDS,
  REFRESH_TOKEN_LIFETIME_SECONDS,
} from "../constants/time.ts";
import type {
  LoginBody,
  RefreshBody,
  RegisterBody,
} from "../validators/auth.validator.ts";

type JwtPayload = {
  sub: string;
  type?: "refresh";
};

function signAccessToken(userId: number) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_LIFETIME_SECONDS,
  });
}

function signRefreshToken(userId: number) {
  return jwt.sign(
    { sub: String(userId), type: "refresh" satisfies JwtPayload["type"] },
    process.env.JWT_SECRET!,
    { expiresIn: REFRESH_TOKEN_LIFETIME_SECONDS },
  );
}

async function rotateRefreshToken(userId: number) {
  // У ТЗ: при login старий refresh токен замінюється новим.
  // Тримаємо 1 активний refresh token на користувача.
  await prisma.refreshToken.deleteMany({ where: { userId } });

  const refreshToken = signRefreshToken(userId);
  const decoded = jwt.decode(refreshToken) as jwt.JwtPayload | null;

  const expSeconds = decoded?.exp;
  const expiresAt =
    typeof expSeconds === "number"
      ? new Date(expSeconds * 1000)
      : new Date(Date.now() + REFRESH_TOKEN_LIFETIME_SECONDS * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt,
    },
  });

  return refreshToken;
}

export async function register(req: Request<{}, {}, RegisterBody>, res: Response) {
  const { username, email, password, name } = req.body;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (exists) {
    throw createHttpError(409, "Username or email already taken");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: passwordHash, name },
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = await rotateRefreshToken(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  });
}

export async function login(req: Request<{}, {}, LoginBody>, res: Response) {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw createHttpError(401, "Invalid credentials");
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = await rotateRefreshToken(user.id);

  res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req: Request<{}, {}, RefreshBody>, res: Response) {
  const { refreshToken } = req.body;

  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    throw createHttpError(401, "Invalid or expired refresh token");
  }

  if (payload.type !== "refresh") {
    throw createHttpError(401, "Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!stored) {
    throw createHttpError(401, "Invalid or expired refresh token");
  }

  // Ротація токенів: видаляємо старий, створюємо новий
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const userId = Number(payload.sub);
  const accessToken = signAccessToken(userId);
  const newRefreshToken = await rotateRefreshToken(userId);

  res.status(200).json({
    accessToken,
    refreshToken: newRefreshToken,
  });
}

