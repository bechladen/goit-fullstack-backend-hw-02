import { z } from "zod";
import { registry } from "../openapi.ts";

export const RegisterSchema = registry.register(
  "RegisterBody",
  z.object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "username може містити лише a-z, 0-9 та _"),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2).max(100),
  }),
);

export const LoginSchema = registry.register(
  "LoginBody",
  z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
);

export const RefreshSchema = registry.register(
  "RefreshBody",
  z.object({
    refreshToken: z.string().min(1),
  }),
);

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Реєстрація користувача",
  request: {
    body: {
      content: { "application/json": { schema: RegisterSchema } },
    },
  },
  responses: {
    201: { description: "User created + tokens" },
    409: { description: "Username or email already taken" },
    422: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Вхід користувача",
  request: {
    body: { content: { "application/json": { schema: LoginSchema } } },
  },
  responses: {
    200: { description: "Tokens issued" },
    401: { description: "Invalid credentials" },
    422: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Оновлення пари токенів",
  request: {
    body: { content: { "application/json": { schema: RefreshSchema } } },
  },
  responses: {
    200: { description: "Tokens refreshed" },
    401: { description: "Invalid or expired refresh token" },
    422: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Вихід (інвалідація refresh токена)",
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "No Content" },
    401: { description: "Authentication required" },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Профіль поточного користувача",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Current user profile" },
    401: { description: "Authentication required" },
  },
});

export type RegisterBody = z.infer<typeof RegisterSchema>;
export type LoginBody = z.infer<typeof LoginSchema>;
export type RefreshBody = z.infer<typeof RefreshSchema>;

