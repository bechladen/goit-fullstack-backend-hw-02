import { Router } from "express";

import * as authController from "../controllers/auth.controller.ts";
import { validateBody } from "../middleware/validate.ts";
import {
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
} from "../validators/auth.validator.ts";

const router = Router();

router.post("/register", validateBody(RegisterSchema), authController.register);
router.post("/login", validateBody(LoginSchema), authController.login);
router.post("/refresh", validateBody(RefreshSchema), authController.refresh);

export default router;

