import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { createApiResponse } from "@/common/swagger/swagger-response-builder";
import {
  loginSchema,
  extendTokenSchema,
  forgotPasswordSchema,
  logoutSchema,
  registerSchema,
  resetPasswordSchema,
  authResponseSchema,
} from "@/schemas/auth.dto";
import { AuthController } from "@/controllers/auth.controller";
import { zodValidation } from "@/middlewares/zod-validation";
import { authMiddleware } from "@/middlewares/auth-middleware";

const authRouter = Router();

const TAG = "Auth";
const ROUTE = `/${TAG.toLowerCase()}`;

export const authRegistry = new OpenAPIRegistry();
const authController = new AuthController();

authRegistry.register(TAG, loginSchema);

authRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/login`,
  tags: [TAG],
  summary: "Login",
  request: {
    body: {
      content: { "application/json": { schema: loginSchema } },
    },
  },
  responses: createApiResponse(authResponseSchema, "Login Successfully"),
});
authRouter.post("/login", zodValidation(loginSchema), authController.login);

//====================================================================================================

authRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/register`,
  tags: [TAG],
  summary: "Register",
  request: {
    body: {
      content: { "application/json": { schema: registerSchema } },
    },
  },
  responses: createApiResponse(authResponseSchema, "Register Successfully"),
});
authRouter.post("/register", zodValidation(registerSchema), authController.register);

//====================================================================================================

authRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/extend-token`,
  tags: [TAG],
  summary: "Extend Token",
  request: {
    body: {
      content: { "application/json": { schema: extendTokenSchema } },
    },
  },
  responses: createApiResponse(extendTokenSchema, "Token Extended Successfully"),
});
authRouter.post(
  "/extend-token",
  authMiddleware,
  zodValidation(extendTokenSchema),
  authController.extendToken,
);

//====================================================================================================

authRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/logout`,
  tags: [TAG],
  summary: "Logout",
  responses: createApiResponse(logoutSchema, "Logout Successfully"),
});
authRouter.get("/logout", authMiddleware, authController.logout);

//====================================================================================================

authRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/forgot-password`,
  tags: [TAG],
  summary: "Forgot Password",
  request: {
    body: {
      content: { "application/json": { schema: forgotPasswordSchema } },
    },
  },
  responses: createApiResponse(forgotPasswordSchema, "Reset link sent. Check you email"),
});
authRouter.post(
  "/forgot-password",
  zodValidation(forgotPasswordSchema),
  authController.forgotPassword,
);

//====================================================================================================

authRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/reset-password`,
  tags: [TAG],
  summary: "Reset Password",
  request: {
    body: {
      content: { "application/json": { schema: resetPasswordSchema } },
    },
  },
  responses: createApiResponse(resetPasswordSchema, "Password reset successful"),
});
authRouter.post(
  "/reset-password",
  zodValidation(resetPasswordSchema),
  authController.resetPassword,
);

export default authRouter;
