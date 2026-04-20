import dotenv from "dotenv";
dotenv.config(); // 🔒 FORCE env load HERE

import multer from "multer";
import path from "path";
import fs from "fs";

/* ======================
   MULTER (TEMP STORAGE)
====================== */
const TEMP_DIR = "temp";
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image/video allowed"), false);
  }
};

export const uploadStory = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

/* ======================
   CLOUDINARY UPLOAD
====================== */
export const uploadStoryToCloudinary = async (filePath) => {
  const { v2: cloudinary } = await import("cloudinary");

  // ENV IS GUARANTEED LOADED NOW
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary ENV missing at runtime");
  }

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "auto",
    folder: "stories",
  });

  fs.unlinkSync(filePath);
  return result.secure_url;
};

export const uploadReel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // reels can be bigger
});

export const uploadReelToCloudinary = async (filePath) => {
  const { v2: cloudinary } = await import("cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "video",
    folder: "reels",
  });

  fs.unlinkSync(filePath);
  return result.secure_url;
};
export const uploadPost = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadPostToCloudinary = async (filePath) => {
  const { v2: cloudinary } = await import("cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "image",
    folder: "posts",
  });

  fs.unlinkSync(filePath);
  return result.secure_url;
};
