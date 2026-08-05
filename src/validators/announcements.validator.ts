import { z } from "zod";
import { registry } from "../openapi.ts";

export const AnnouncementIdParamsSchema = registry.register(
  "AnnouncementIdParams",
  z.object({
    id: z.coerce.number().int().positive(),
  }),
);

export const AnnouncementsQuerySchema = registry.register(
  "AnnouncementsQuery",
  z.object({
    search: z.string().min(1).max(50).optional(),
    sort: z.enum(["newest", "oldest"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
  }),
);

export const CreateAnnouncementSchema = registry.register(
  "CreateAnnouncementBody",
  z.object({
    title: z.string().min(5).max(50),
    description: z.string().min(10),
    price: z.number().int().positive(),
    category: z.enum(["sale", "service", "job", "other"]),
  }),
);

export const UpdateAnnouncementSchema = registry.register(
  "UpdateAnnouncementBody",
  CreateAnnouncementSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { error: "At least one field must be provided" },
  ),
);

registry.registerPath({
  method: "get",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Список оголошень (пошук/сортування/пагінація)",
  request: {
    query: AnnouncementsQuerySchema,
  },
  responses: {
    200: { description: "Announcements list" },
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Оголошення за ID",
  request: { params: AnnouncementIdParamsSchema },
  responses: {
    200: { description: "Announcement" },
    404: { description: "Announcement not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Створення оголошення",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateAnnouncementSchema } },
    },
  },
  responses: {
    201: { description: "Created" },
    401: { description: "Authentication required" },
    422: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Часткове оновлення (тільки власне оголошення)",
  security: [{ bearerAuth: [] }],
  request: {
    params: AnnouncementIdParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateAnnouncementSchema } },
    },
  },
  responses: {
    200: { description: "Updated" },
    401: { description: "Authentication required" },
    403: { description: "Access denied" },
    404: { description: "Announcement not found" },
    422: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Видалення (тільки власне оголошення)",
  security: [{ bearerAuth: [] }],
  request: { params: AnnouncementIdParamsSchema },
  responses: {
    204: { description: "No Content" },
    401: { description: "Authentication required" },
    403: { description: "Access denied" },
    404: { description: "Announcement not found" },
  },
});

export type AnnouncementIdParams = z.infer<typeof AnnouncementIdParamsSchema>;
export type AnnouncementsQuery = z.infer<typeof AnnouncementsQuerySchema>;
export type CreateAnnouncementBody = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementBody = z.infer<typeof UpdateAnnouncementSchema>;

