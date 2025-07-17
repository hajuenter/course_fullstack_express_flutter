import bcrypt from "bcrypt";
import userModel from "../../models/user-model.js";
import jwt from "jsonwebtoken";
import AppError from "../../utils/app-error.js";

export const loginService = async (email, password) => {
  const errors = [];
  const trimmedEmail = email ? email.trim() : "";

  if (!trimmedEmail || trimmedEmail === "") {
    errors.push("Email wajib diisi");
  }

  if (!password || password.trim() === "") {
    errors.push("Password wajib diisi");
  }

  if (errors.length > 0) {
    throw new AppError(400, "Validasi gagal, " + errors.join(", "));
  }

  const user = await userModel.findOne({ email: trimmedEmail.toLowerCase() });

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
    success: true,
    status: 200,
    message: "Login berhasil",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};
