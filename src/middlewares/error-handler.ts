import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { logger } from "../common/winston/winston";

interface RequestWithUser extends Request {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: any,
  req: RequestWithUser,
  res: Response,
  _: NextFunction,
): Response => {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const { message, ...details } = err;
  const isHttpError = err instanceof HttpError;

  const statusCode = isHttpError
    ? err.status || StatusCodes.INTERNAL_SERVER_ERROR
    : StatusCodes.INTERNAL_SERVER_ERROR;
  const name = isHttpError ? err.name : "AppError";
  const user = req.user?.email || "Unknown User";
  const { method } = req;
  const url = req.originalUrl;

  const { stack } = err;

  const errorPayload = {
    status: statusCode,
    message,
    method,
    url,
    user,
    name,
    details,
    stack,
  };

  logger.error(JSON.stringify(errorPayload));

  const responsePayload = {
    status: statusCode,
    message,
    ...(env.NODE_ENV !== "production" && { method, url, user, name, details, stack }),
  };

  return res.status(statusCode).json(responsePayload);
};
