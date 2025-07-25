import bcrypt from "bcrypt";
import userModel from "../../models/user-model.js";
import jwt from "jsonwebtoken";
import AppError from "../../utils/app-error.js";

export const loginService = async (email, password) => {
  try {
    const normalizedEmail = email.toLowerCase();

    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      throw new AppError(401, "Email atau password salah");
    }

    const verifPassword = await bcrypt.compare(password, user.password);

    if (!verifPassword) {
      throw new AppError(401, "Email atau password salah");
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      message: "Login berhasil",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Login Service Error: " + error.message);
  }
};
