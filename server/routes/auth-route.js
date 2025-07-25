import express from "express";
import {
  loginController,
  forgotPasswordController,
  registerController,
  resetPasswordController,
  verifOtpController,
} from "../controllers/auth-controller.js";

import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifOtpValidation,
  resetPasswordValidation,
} from "../validations/auth-validation.js";

import { validate } from "../middleware/validation-middleware.js";

const authRouter = express.Router();

authRouter.post("/register", validate(registerValidation), registerController);
authRouter.post("/login", validate(loginValidation), loginController);
authRouter.post(
  "/lupa-password",
  validate(forgotPasswordValidation),
  forgotPasswordController
);
authRouter.post("/verif-otp", validate(verifOtpValidation), verifOtpController);
authRouter.post(
  "/reset-password",
  validate(resetPasswordValidation),
  resetPasswordController
);

export default authRouter;
