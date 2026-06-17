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

const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpeg, png, and webp images are allowed"), false);
  }
};

const videoFilter = (req, file, cb) => {
  const allowedTypes = ["video/mp4", "video/quicktime"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only mp4 and quicktime videos are allowed"), false);
  }
};

const storyFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpeg/png/webp images and mp4/quicktime videos are allowed for stories"), false);
  }
};

export const avatarUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const uploadStory = multer({
  storage,
  fileFilter: storyFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
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
  fileFilter: videoFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
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
