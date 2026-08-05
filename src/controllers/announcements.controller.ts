import createHttpError from "http-errors";
import type { RequestHandler } from "express";

import prisma from "../../prisma/client.ts";
import type {
  AnnouncementsQuery,
  CreateAnnouncementBody,
  UpdateAnnouncementBody,
} from "../validators/announcements.validator.ts";

const PER_PAGE = 10;

export const listAnnouncements: RequestHandler = async (_req, res) => {
  const query = res.locals.query as AnnouncementsQuery | undefined;

  const search = query?.search;
  const sort = query?.sort ?? "newest";
  const page = query?.page ?? 1;

  const where =
    search && search.trim().length > 0
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const skip = (page - 1) * PER_PAGE;

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy,
      skip,
      take: PER_PAGE,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.announcement.count({ where }),
  ]);

  res.status(200).json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
      perPage: PER_PAGE,
    },
  });
};

export const getAnnouncementById: RequestHandler = async (req, res) => {
  const id = Number(req.params.id);

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, email: true, name: true },
      },
    },
  });

  if (!announcement) {
    return res.status(404).json({ error: "Announcement not found" });
  }

  res.status(200).json(announcement);
};

export const createAnnouncement: RequestHandler = async (req, res) => {
  const userId = Number(req.user?.sub);
  if (!userId) {
    throw createHttpError(401, "Authentication required");
  }

  const { title, description, price, category } = req.body as CreateAnnouncementBody;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      description,
      price,
      category,
      user: {
        connect: { id: userId },
      },
    },
    include: {
      user: {
        select: { id: true, username: true, email: true, name: true },
      },
    },
  });

  res.status(201).json(announcement);
};

export const updateAnnouncement: RequestHandler = async (req, res) => {
  const userId = Number(req.user?.sub);
  if (!userId) {
    throw createHttpError(401, "Authentication required");
  }

  const id = Number(req.params.id);

  const existing = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createHttpError(404, "Announcement not found");
  }

  if (existing.userId !== userId) {
    throw createHttpError(403, "Access denied");
  }

  const { title, description, price, category } = req.body as UpdateAnnouncementBody;

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      title,
      description,
      price,
      category,
    },
    include: {
      user: {
        select: { id: true, username: true, email: true, name: true },
      },
    },
  });

  res.status(200).json(updated);
};

export const deleteAnnouncement: RequestHandler = async (req, res) => {
  const userId = Number(req.user?.sub);
  if (!userId) {
    throw createHttpError(401, "Authentication required");
  }

  const id = Number(req.params.id);

  const existing = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createHttpError(404, "Announcement not found");
  }

  if (existing.userId !== userId) {
    throw createHttpError(403, "Access denied");
  }

  await prisma.announcement.delete({ where: { id } });

  res.status(204).end();
};

