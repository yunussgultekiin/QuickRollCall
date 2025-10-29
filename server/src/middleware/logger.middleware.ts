import winston from "winston";
import { config } from "../api/config";

const lineFormat = winston.format.printf(({ timestamp, level, message, requestId }) => {
  const rid = requestId ? ` [rid:${requestId}]` : "";
  return `[${timestamp}] ${level}: ${message}${rid}`;
});

const devConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  lineFormat
);

const prodConsoleFormat = winston.format.combine(
  winston.format.timestamp(),
  lineFormat
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.isProd ? prodConsoleFormat : devConsoleFormat,
  }),
];

const logger = winston.createLogger({
  level: config.isProd ? "info" : "debug",
  transports,
});

export default logger;