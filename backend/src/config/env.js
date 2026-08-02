import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

// Critical variables required for both dev and prod
const criticalEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "AGORA_APP_ID",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

// Variables that are optional in dev, but strictly required in production
const prodRequiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "GEMINI_API_KEY"
];

const missingCritical = [];
for (const key of criticalEnvVars) {
  if (!process.env[key] || process.env[key].trim() === "") {
    missingCritical.push(key);
  }
}

// Special check for Agora certificates
const hasAgoraCert = (process.env.AGORA_APP_CERTIFICATE && process.env.AGORA_APP_CERTIFICATE.trim() !== "") ||
                      (process.env.AGORA_PRIMARY_CERTIFICATE && process.env.AGORA_PRIMARY_CERTIFICATE.trim() !== "");
if (!hasAgoraCert) {
  missingCritical.push("AGORA_APP_CERTIFICATE (or AGORA_PRIMARY_CERTIFICATE)");
}

if (missingCritical.length > 0) {
  console.error("\x1b[31m❌ CRITICAL CONFIGURATION ERROR: Missing required environment variable(s):\x1b[0m");
  missingCritical.forEach(v => console.error(`   - ${v}`));
  console.error("\nServer cannot start without these configured. Exiting...\n");
  process.exit(1);
}

const missingProd = [];
for (const key of prodRequiredEnvVars) {
  if (!process.env[key] || process.env[key].trim() === "") {
    missingProd.push(key);
  }
}

if (missingProd.length > 0) {
  if (isProd) {
    console.error("\x1b[31m❌ PRODUCTION CONFIGURATION ERROR: Missing required production environment variable(s):\x1b[0m");
    missingProd.forEach(v => console.error(`   - ${v}`));
    console.error("\nServer cannot start in production without these configured. Exiting...\n");
    process.exit(1);
  } else {
    console.warn("\x1b[33m⚠️ CONFIGURATION WARNING: Missing optional environment variable(s) for local development:\x1b[0m");
    missingProd.forEach(v => console.warn(`   - ${v}`));
    console.warn("Nodemailer and Vibe AI integration will run with dev console-fallbacks.\n");
  }
}

// Port check if SMTP_PORT is present
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
if (process.env.SMTP_PORT && isNaN(smtpPort)) {
  console.error("\x1b[31m❌ CRITICAL CONFIGURATION ERROR: SMTP_PORT must be a valid integer.\x1b[0m");
  process.exit(1);
}

// Export validated and sanitized config
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  AGORA_APP_ID: process.env.AGORA_APP_ID.replace(/['"]/g, "").trim(),
  AGORA_APP_CERTIFICATE: (process.env.AGORA_PRIMARY_CERTIFICATE || process.env.AGORA_APP_CERTIFICATE).replace(/['"]/g, "").trim(),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: smtpPort,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:8080"
};
