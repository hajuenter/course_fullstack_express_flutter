import bcrypt from "bcrypt";
import userModel from "../../models/user-model.js";
import AppError from "../../utils/app-error.js";

export const registerService = async (name, email, password) => {
  try {
    const existingUser = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      throw new AppError(400, "Email sudah digunakan");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    return {
      message: "Registrasi berhasil",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Register Service Error: " + error.message);
  }
};
