import { NextFunction, Response } from "express";
import { CustomRequest } from "@/types/request";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "@/common/jwt/jwt";
import { winstonLogger } from "@/common/winston/winston";

export const authMiddleware = (req: CustomRequest, _: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, "Unauthorized", {
      resource: "Auth Middleware",
    });
  }

  const verify = verifyToken(token);
  req.loggedUser = verify.email || verify.type;
  winstonLogger.defaultMeta = { loggedUser: verify.email || verify.type };
  next();
};

// Export const authMiddleware = (requiredPermission?: string) => {
//   Return (req: CustomRequest, res: Response, next: NextFunction) => {
//     Const authHeader = req.headers.authorization;
//     If (!authHeader) {
//       Throw createHttpError(StatusCodes.UNAUTHORIZED, "Unauthorized", {
//         Resource: "Auth Middleware",
//       });
//     }

//     Const token = authHeader.split(" ")[1];
//     Try {
//       Const verify = verifyToken(token);
//       Req.user = verify;
//       Req.loggedUser = verify.email || verify.type;
//       WinstonLogger.defaultMeta = { loggedUser: verify.email || verify.type };

//       If (requiredPermission && !verify.permissions.includes(requiredPermission)) {
//         Return res.status(403).json({ error: "Forbidden" });
//       }

//       Return next();
//     } catch {
//       Throw createHttpError(StatusCodes.UNAUTHORIZED, "Unauthorized", {
//         Resource: "Auth Middleware",
//       });
//     }
//   };
// };
