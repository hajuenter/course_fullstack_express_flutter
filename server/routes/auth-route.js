import express from "express";
import {
  loginController,
  forgotPasswordController,
  registerController,
  resetPasswordController,
  verifOtpController,
} from "../controllers/auth-controller.js";

const authRouter = express.Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/lupa-password", forgotPasswordController);
authRouter.post("/verif-otp", verifOtpController);
authRouter.post("/reset-password", resetPasswordController);

export default authRouter;
