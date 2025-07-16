import express from "express";
import {
  LoginController,
  ForgotPasswordController,
  RegisterController,
  ResetPasswordController,
  VerifOtpController,
} from "../controllers/auth-controller.js";

const authRouter = express.Router();

authRouter.post("/register", RegisterController);
authRouter.post("/login", LoginController);
authRouter.post("/lupa-password", ForgotPasswordController);
authRouter.post("/verif-otp", VerifOtpController);
authRouter.post("/reset-password", ResetPasswordController);

export default authRouter;
