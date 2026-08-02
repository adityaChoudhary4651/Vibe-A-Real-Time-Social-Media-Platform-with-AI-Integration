import winston from "winston";
import { env } from "./env.js";

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json, errors } = format;

// Custom format for development console logging
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create the winston logger instance
const logger = createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }) // Capture stack trace for Error objects
  ),
  transports: [
    new transports.Console({
      format: env.NODE_ENV === "production"
        ? combine(json()) // Structured JSON logs in production
        : combine(colorize(), consoleFormat) // Pretty colorized logs in development
    })
  ],
  exitOnError: false // Do not exit on handled exceptions
});

// A stream object for Morgan middleware HTTP log integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

export default logger;
