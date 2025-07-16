import bcrypt from "bcrypt";
import User from "../../models/user-model.js";
import AppError from "../../utils/app-error.js";

export const RegisterService = async (name, email, password) => {
  const errors = [];

  if (!name || name.trim() === "") {
    errors.push("Nama wajib diisi");
  }

  if (!email || email.trim() === "") {
    errors.push("Email wajib diisi");
  }

  if (!password || password.trim() === "") {
    errors.push("Password wajib diisi");
  }

  const strongPasswordRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (password && !strongPasswordRegex.test(password)) {
    errors.push("Password harus mengandung huruf, angka dan simbol");
  }

  if (email && !emailRegex.test(email)) {
    errors.push("Format email tidak valid");
  }

  const existingUser = await User.findOne({
    email: email.trim().toLowerCase(),
  });
  if (existingUser) {
    errors.push("Email sudah digunakan");
  }

  if (errors.length > 0) {
    throw new AppError(400, "Validasi gagal, " + errors.join(", "));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
  });

  await newUser.save();

  return {
    success: true,
    status: 201,
    message: "Registrasi berhasil",
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  };
};
