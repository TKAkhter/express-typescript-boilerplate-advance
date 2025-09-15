import "winston-daily-rotate-file";
import { createLogger, format, transports, Logger } from "winston";
import { StatusCodes } from "http-status-codes";
import { env } from "@/config/env";
import fs from "fs";
import colors from "colors/safe";
import "winston-mongodb";
import { cleanObject } from "@/utils/utils";

const {
  ENABLE_WINSTON,
  LOGS_TYPE = "mongodb",
  TZ = "UTC",
  MONGODB_URI = "",
  // NODE_ENV,
  MONGODB_ERROR_COLLECTION_NAME,
  LOGS_DIRECTORY,
  LOG_FILE_DURATION,
} = env;
const isMongoDBLogEnabled = LOGS_TYPE === "mongodb";

// Const insertDatabaseNameIntoMongoUri = (uri: string, dbName: string): string => {
//   Const [base, query] = uri.split("?");
//   Return query ? `${base}${dbName}?${query}` : `${base}/${dbName}`;
// };

if (!fs.existsSync(LOGS_DIRECTORY) && ENABLE_WINSTON && !isMongoDBLogEnabled) {
  fs.mkdirSync(LOGS_DIRECTORY);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatConsoleMetaData = (metadata: any) => {
  if (!metadata) {
    return "";
  }

  const { code, message, meta, name, response, details, status } = metadata;
  const resolvedDetails = details || {};

  const raw = {
    details: {
      code: code || resolvedDetails.code || null,
      message: message || resolvedDetails.message || null,
      meta: { ...(meta || resolvedDetails.meta || {}) },
      data: { ...(response?.data || resolvedDetails?.data || {}) },
      status: response?.status || resolvedDetails?.status || status || null,
      statusText: response?.statusText || resolvedDetails?.statusText || null,
      name: name || resolvedDetails.name || null,
    },
  };

  return cleanObject(raw);
};

// NestJS-like console log format
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ level, message, timestamp, ...meta }) => {
    const metadata = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return `[${colors.cyan(timestamp as string)} ${TZ}] ${level}: ${meta.loggedUser ?? ""} ${message} ${metadata}`;
  }),
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.json(),
);

// ==== Transports ====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loggerTransports: any[] = [];

// ---- Console + File Transports ----
if (ENABLE_WINSTON) {
  loggerTransports.push(new transports.Console({ level: "debug", format: consoleFormat }));

  if (LOGS_TYPE !== "mongodb") {
    loggerTransports.push(
      new transports.DailyRotateFile({
        filename: "info-%DATE%.log",
        dirname: LOGS_DIRECTORY,
        level: "info",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: LOG_FILE_DURATION,
        format: fileFormat,
      }),
      new transports.DailyRotateFile({
        filename: "error-%DATE%.log",
        dirname: LOGS_DIRECTORY,
        level: "error",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: LOG_FILE_DURATION,
        format: fileFormat,
      }),
    );
  }
}

// ---- MongoDB Transports ----
if (isMongoDBLogEnabled) {
  loggerTransports.push(
    new transports.MongoDB({
      db: MONGODB_URI, //InsertDatabaseNameIntoMongoUri(MONGODB_URI, NODE_ENV as string),
      collection: MONGODB_ERROR_COLLECTION_NAME,
      level: "error",
      format: fileFormat,
    }),
  );
}

// ==== Winston Logger ====
export const winstonLogger: Logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
  ),
  transports: loggerTransports,
  exitOnError: false,
});

// ==== Public Logger API ====
export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (msg: string, meta?: any) => {
    return ENABLE_WINSTON
      ? winstonLogger.info(msg, formatConsoleMetaData(meta))
      : console.log(colors.green(msg), meta ? formatConsoleMetaData(meta) : "");
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (msg: string, meta?: any) => {
    return ENABLE_WINSTON
      ? winstonLogger.debug(msg, formatConsoleMetaData(meta))
      : console.log(colors.magenta(msg), meta ? formatConsoleMetaData(meta) : "");
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (msg: string, meta?: any) => {
    return ENABLE_WINSTON
      ? winstonLogger.warn(msg, formatConsoleMetaData(meta))
      : console.log(colors.yellow(msg), meta ? formatConsoleMetaData(meta) : "");
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  http: (msg: string, meta?: any) => {
    return ENABLE_WINSTON
      ? winstonLogger.http(msg, formatConsoleMetaData(meta))
      : console.log(colors.blue(msg), meta ? formatConsoleMetaData(meta) : "");
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (msg: string, meta?: any) => {
    return ENABLE_WINSTON
      ? winstonLogger.error(msg, formatConsoleMetaData(meta))
      : console.error(msg, meta ? formatConsoleMetaData(meta) : "");
  },
};

// ==== Morgan stream for request logging ====
export const morganStream = {
  write: (message: string) => {
    // eslint-disable-next-line no-control-regex
    const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, "");
    const clean = stripAnsi(message);
    const statusCode = parseInt(clean.split(" ")[2], 10);
    if (statusCode >= StatusCodes.BAD_REQUEST) {
      logger.warn(message.trim());
    } else {
      logger.http(message.trim());
    }
  },
};
