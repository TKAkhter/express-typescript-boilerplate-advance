import { NextFunction, Response } from "express";
import { HttpError } from "http-errors";
import { StatusCodes } from "http-status-codes";
import { env } from "@/config/env";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { prismaInstance } from "@/config/prisma/prisma";

const prisma = prismaInstance();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findDeep = (obj: any, keys: string[]): any => {
  if (!obj || typeof obj !== "object") {
    return null;
  }
  for (const key of keys) {
    if (key in obj) {
      return obj[key];
    }
  }
  for (const value of Object.values(obj)) {
    const found = findDeep(value, keys);
    if (found) {
      return found;
    }
  }
  return null;
};

/**
 * Error middleware for catching and logging errors.
 *
 * Params:
 * - err: The error object (could be a HttpError or general error).
 * - req: The request object (with optional user data).
 * - res: The response object.
 * - _: The NextFunction (unused in this case).
 *
 * Response:
 * - Responds with the appropriate status code and error message in the response.
 * - If not in production, detailed error info is included (method, URL, stack trace).
 */
export const errorMiddleware = (
  err: Error | HttpError,
  req: CustomRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: NextFunction,
): Response => {
  const { message, ...details } = err;
  const isHttpError = err instanceof HttpError;

  const statusCode = isHttpError
    ? err.status || StatusCodes.INTERNAL_SERVER_ERROR
    : StatusCodes.INTERNAL_SERVER_ERROR;

  const appName = isHttpError ? err.name : "AppError";

  const loggedUser = req.loggedUser || "Unknown User";
  const { method } = req;
  const url = req.originalUrl;

  const stack = err.stack || "";

  // Extract email or id using the helper function
  const email = findDeep(req.body, ["email"]);
  const id = findDeep(req.body, ["id"]);

  // Extract common properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { code, meta, name, response }: any = details;

  const transformDetails = {
    code,
    meta: { ...meta },
    data: { ...response?.data },
    status: response?.status,
    statusText: response?.statusText,
    name,
    email,
    id,
  };

  const errorPayload = {
    status: statusCode,
    message: message.trim(),
    method,
    url,
    loggedUser,
    name: appName,
    details: transformDetails,
    stack,
  };

  logger.error(errorPayload.message, errorPayload);

  if (!env.ENABLE_WINSTON) {
    const errorLogs = {
      ...errorPayload,
      message,
      status: String(errorPayload.status),
    };

    prisma.errorLogs
      .create({
        data: errorLogs,
      })
      .then(() => logger.info("Error logs saved successfully"))
      .catch((error) => logger.error("Error saving error logs", error));
  }

  const responsePayload = {
    status: statusCode,
    message: message.trim(),
    ...(env.NODE_ENV !== "production" && {
      method,
      url,
      loggedUser,
      name,
      details: transformDetails,
      stack,
    }),
  };

  return res.status(statusCode).json(responsePayload);
};
