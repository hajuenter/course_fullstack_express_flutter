import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "../configs/db.js";
import authRouter from "../routes/auth-route.js";
import productRouter from "../routes/product-route.js";
import { errorHandler } from "../middleware/error-handler-middleware.js";

const web = express();

await connectDB();

web.use(cors());
web.use(express.json());

web.get("/", (req, res) => res.send("API is working"));
web.use("/api/auth", authRouter);
web.use("/api/product", productRouter);

web.use(errorHandler);

export default web;
