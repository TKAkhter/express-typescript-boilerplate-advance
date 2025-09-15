import { createUsersSchema, updateUsersSchema } from "@/schemas/users.dto";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { UserController } from "@/controllers/users.controller";
import { zodValidation } from "@/middlewares/zod-validation";
import { authMiddleware } from "@/middlewares/auth-middleware";
import { createApiResponse } from "@/common/swagger/swagger-response-builder";
import { z } from "zod";
import { findByQuerySchema } from "@/schemas/find-by-query";
import { Router } from "express";
import { importFileSchema } from "@/schemas/import-file";
import { uploadImportMiddleware } from "@/common/multer/multer";
import { UsersSchema } from "@/generated/zod";

const userRouter = Router();
userRouter.use(authMiddleware);

const TAG = "Users";
const ROUTE = `/${TAG.toLowerCase()}`;

export const userRegistry = new OpenAPIRegistry();
const userController = new UserController();

userRegistry.register(TAG, UsersSchema);

userRegistry.registerPath({
  method: "get",
  path: ROUTE,
  summary: `Get all ${TAG}`,
  tags: [TAG],
  responses: createApiResponse(z.array(UsersSchema), "Success"),
});
userRouter.get("/", userController.getAll);

//====================================================================================================

userRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/import`,
  tags: [TAG],
  summary: `Import ${TAG}`,
  request: {
    body: {
      content: { "multipart/form-data": { schema: importFileSchema } },
    },
  },
  responses: createApiResponse(z.null(), `${TAG}s Imported Successfully`),
});
userRouter.post("/import", uploadImportMiddleware, userController.import);

//====================================================================================================

userRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/export`,
  summary: `Export ${TAG}`,
  tags: [TAG],
  responses: createApiResponse(z.null(), `${TAG}s Exported Successfully`),
});
userRouter.get("/export", userController.export);

//====================================================================================================

userRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/{id}`,
  tags: [TAG],
  summary: `Get ${TAG} by id`,
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: createApiResponse(UsersSchema, "Success"),
});
userRouter.get("/:id", userController.getById);

//====================================================================================================

userRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/email/{email}`,
  tags: [TAG],
  summary: `Get ${TAG} by email`,
  request: {
    params: z.object({ email: z.string() }),
  },
  responses: createApiResponse(UsersSchema, "Success"),
});
userRouter.get("/email/:email", userController.getByEmail);

//====================================================================================================

userRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/find`,
  tags: [TAG],
  summary: `Find ${TAG} by query`,
  request: {
    body: {
      content: { "application/json": { schema: findByQuerySchema } },
    },
  },
  responses: createApiResponse(z.array(findByQuerySchema), "Success"),
});
userRouter.post("/find", zodValidation(findByQuerySchema), userController.findByQuery);

//====================================================================================================

userRegistry.registerPath({
  method: "post",
  path: ROUTE,
  tags: [TAG],
  summary: `Create ${TAG}`,
  request: {
    body: {
      content: { "application/json": { schema: createUsersSchema } },
    },
  },
  responses: createApiResponse(createUsersSchema, `${TAG} Created Successfully`),
});
userRouter.post("/", zodValidation(createUsersSchema), userController.create);

//====================================================================================================

userRegistry.registerPath({
  method: "put",
  path: `${ROUTE}/{id}`,
  tags: [TAG],
  summary: `Update ${TAG}`,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "application/json": { schema: updateUsersSchema } },
    },
  },
  responses: createApiResponse(UsersSchema, `${TAG} Updated Successfully`),
});
userRouter.put("/:id", zodValidation(updateUsersSchema), userController.update);

//====================================================================================================

userRegistry.registerPath({
  method: "delete",
  path: `${ROUTE}/bulk`,
  tags: [TAG],
  summary: `Delete ${TAG} in bulk`,
  request: {
    body: {
      content: { "application/json": { schema: z.object({ ids: z.array(z.string()) }) } },
    },
  },
  responses: createApiResponse(z.null(), `${TAG}s Deleted Successfully`),
});
userRouter.delete(
  "/bulk",
  zodValidation(z.object({ ids: z.array(z.string()) })),
  userController.deleteMany,
);

//====================================================================================================

userRegistry.registerPath({
  method: "delete",
  path: `${ROUTE}/{id}`,
  tags: [TAG],
  summary: `Delete ${TAG}`,
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: createApiResponse(z.null(), `${TAG} Deleted Successfully`),
});
userRouter.delete("/:id", userController.delete);

export default userRouter;
