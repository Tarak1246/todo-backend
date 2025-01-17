import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Create logger instance
const logger = createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: "logs/info-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      maxFiles: "14d",
    }),
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "30d",
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;
