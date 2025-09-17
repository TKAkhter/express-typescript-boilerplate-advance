import { sign, verify } from "jsonwebtoken";
import { env } from "@/config/env";
import { StatusCodes } from "http-status-codes";
import createHttpError from "http-errors";
import { ExtendedJWTPayload } from "@/types/types";

export const generateToken = (payload: object): string => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { exp, iat, nbf, ...rest } = payload as ExtendedJWTPayload;
  // @ts-expect-error - The payload is an object
  return sign(rest, env.JWT_SECRET, { expiresIn: env.JWT_SECRET_EXPIRATION });
};

export const generateResetToken = (payload: object): string => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { exp, iat, nbf, ...rest } = payload as ExtendedJWTPayload;
  const resetPayload = { ...rest, purpose: "reset-password" };
  // @ts-expect-error - The payload is an object
  return sign(resetPayload, env.JWT_SECRET, { expiresIn: env.JWT_SECRET_EXPIRATION });
};

export const verifyToken = (token: string) => {
  try {
    return verify(token, env.JWT_SECRET) as ExtendedJWTPayload;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    throw createHttpError(StatusCodes.FORBIDDEN, "Invalid or expired token", {
      resource: "Auth Middleware",
    });
  }
};
