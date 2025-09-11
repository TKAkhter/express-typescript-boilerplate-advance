import { sign, verify } from "jsonwebtoken";
import { env } from "@/config/env";
import { StatusCodes } from "http-status-codes";
import createHttpError from "http-errors";
import { ExtendedJWTPayload } from "@/types/types";

export const generateToken = (payload: object): string => {
  // @ts-expect-error - The payload is an object
  return sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_SECRET_EXPIRATION });
};

export const verifyToken = (token: string) => {
  try {
    return verify(token, env.JWT_SECRET) as ExtendedJWTPayload;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw createHttpError(StatusCodes.FORBIDDEN, "Invalid or expired token", {
      resource: "Auth Middleware",
    });
  }
};
