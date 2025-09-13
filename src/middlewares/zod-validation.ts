import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError, ZodTypeAny } from "zod";
import { createResponse } from "@/utils/create-response";
import { loggedError } from "@/utils/utils";

export const zodValidation =
  (zSchema: ZodTypeAny) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const data = zSchema.parse(req.body);
      if (data) {
        req.body = data;
        next();
      }
    } catch (error) {
      const errorMessage = `Validation Error: ${(error as ZodError).errors.map((e) => e.message).join(", ")}`;
      loggedError(error, errorMessage);
      return res.status(StatusCodes.BAD_REQUEST).json(
        createResponse({
          data: error,
          message: errorMessage,
          status: StatusCodes.BAD_REQUEST,
        }),
      );
    }
  };
