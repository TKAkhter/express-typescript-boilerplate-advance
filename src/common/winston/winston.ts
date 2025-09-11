import "winston-daily-rotate-file";
import { createLogger, format, transports, Logger } from "winston";
import { StatusCodes } from "http-status-codes";
import { env } from "@/config/env";
import fs from "fs";
import colors from "colors/safe";
import "winston-mongodb";

const isWinstonEnabled = env.ENABLE_WINSTON;
const logsDirectory = env.LOGS_DIRECTORY;
const logsType = env.LOGS_TYPE;
const timeZone = env.TZ;
const logsFileDuration = env.LOG_FILE_DURATION;
const mongodbURI = env.MONGODB_URI;

if (!fs.existsSync(logsDirectory) && isWinstonEnabled && logsType !== "mongodb") {
  fs.mkdirSync(logsDirectory);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatConsoleMetaData = (metadata: any) => {
  if (!metadata) {
    return "";
  }

  // Extract common properties
  const { code, message, meta, name, response, details, status } = metadata;

  // Use details as a fallback for missing properties in metadata
  const resolvedDetails = details || {};

  return {
    details: {
      code: code || resolvedDetails.code || null,
      message: message || resolvedDetails.message || null,
      meta: { ...(meta || resolvedDetails.meta || {}) },
      data: {
        ...(response?.data || resolvedDetails?.data || {}),
      },
      status: response?.status || resolvedDetails?.status || status || null,
      statusText: response?.statusText || resolvedDetails?.statusText || null,
      name: name || resolvedDetails.name || null,
    },
  };
};

// NestJS-like console log format
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format.printf(({ level, message, timestamp, ...meta }: any) => {
    const metadata = meta && Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return `[${colors.cyan(timestamp)} ${timeZone}] ${level}: ${meta.loggedUser ?? ""} ${message} ${metadata}`;
  }),
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.json(),
);

const createMongoTransport = () =>
  new transports.MongoDB({
    db: mongodbURI,
    dbName: env.NODE_ENV,
    collection: env.MONGODB_ERROR_COLLECTION_NAME,
    level: "error",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      format.json(),
    ),
  });

const createDailyRotateTransport = (level: string) =>
  new transports.DailyRotateFile({
    filename: `${level}-%DATE%.log`,
    dirname: logsDirectory,
    datePattern: "YYYY-MM-DD",
    level,
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: logsFileDuration,
    format: format.combine(
      // eslint-disable-next-line no-extra-parens
      format((info) => (info.level === level ? info : false))(),
      fileFormat,
    ),
  });

const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    http: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "blue",
    debug: "magenta",
  },
};

const transportsList = [];
if (isWinstonEnabled) {
  transportsList.push(new transports.Console({ level: "info", format: consoleFormat }));
  if (logsType === "mongodb") {
    transportsList.push(createMongoTransport());
  } else {
    transportsList.push(createDailyRotateTransport("info"));
    transportsList.push(createDailyRotateTransport("error"));
  }
}

export const winstonLogger: Logger = createLogger({
  levels: logLevels.levels,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.align(),
  ),
  transports: transportsList,
});

// Export logger functions with fallback to console logs if disabled
export const logger = {
  // Info: (message: string, metadata?: Record<string, unknown>) =>
  //   IsWinstonEnabled
  //     ? winstonLogger.info(message, metadata)
  //     : console.log(colors.green(message), metadata ?? ""),
  info: (message: string, metadata?: Record<string, unknown>) => {
    return isWinstonEnabled
      ? winstonLogger.info(message, metadata)
      : console.log(colors.green(message), metadata ?? "");
  },

  debug: (message: string, metadata?: Record<string, unknown>) => {
    return isWinstonEnabled
      ? winstonLogger.debug(message, metadata)
      : console.log(colors.magenta(message), metadata ?? "");
  },

  warn: (message: string, metadata?: Record<string, unknown>) => {
    return isWinstonEnabled
      ? winstonLogger.warn(message, metadata)
      : console.log(colors.yellow(message), metadata ?? "");
  },

  http: (message: string, metadata?: Record<string, unknown>) => {
    return isWinstonEnabled
      ? winstonLogger.http(message, metadata)
      : console.log(colors.blue(message), metadata ?? "");
  },

  error: (message: string, metadata?: Record<string, unknown>) => {
    return isWinstonEnabled
      ? winstonLogger.error(message, metadata)
      : console.log(colors.red(message), formatConsoleMetaData(metadata) ?? "");
  },
};

export const morganStream = {
  write: (message: string) => {
    const statusCode = parseInt(message.split(" ")[2], 10);
    if (statusCode >= StatusCodes.BAD_REQUEST) {
      logger.warn(message.trim());
    } else {
      logger.http(message.trim());
    }
  },
};
