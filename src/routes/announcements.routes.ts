import { Router } from "express";

import authenticate from "../middleware/authenticate.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";
import * as announcementsController from "../controllers/announcements.controller.ts";
import {
  AnnouncementIdParamsSchema,
  AnnouncementsQuerySchema,
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
} from "../validators/announcements.validator.ts";

const router = Router();

// Публічні
router.get(
  "/",
  validateQuery(AnnouncementsQuerySchema),
  announcementsController.listAnnouncements,
);
router.get(
  "/:id",
  validateParams(AnnouncementIdParamsSchema),
  announcementsController.getAnnouncementById,
);

// Захищені
router.post(
  "/",
  authenticate,
  validateBody(CreateAnnouncementSchema),
  announcementsController.createAnnouncement,
);
router.patch(
  "/:id",
  authenticate,
  validateParams(AnnouncementIdParamsSchema),
  validateBody(UpdateAnnouncementSchema),
  announcementsController.updateAnnouncement,
);
router.delete(
  "/:id",
  authenticate,
  validateParams(AnnouncementIdParamsSchema),
  announcementsController.deleteAnnouncement,
);

export default router;

