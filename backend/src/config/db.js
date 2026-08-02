import mongoose from "mongoose";
import { env } from "./env.js";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("MongoDB Atlas connected ✅");
  } catch (error) {
    logger.error("MongoDB connection failed ❌", error);
    process.exit(1);
  }
};

export default connectDB;
