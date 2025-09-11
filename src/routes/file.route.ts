import { Router } from "express";
import { uploadMiddleware } from "@/common/multer/multer";
import { FileController } from "@/controllers/file.controller";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { updateFileSchema, uploadFileSchema } from "@/schemas/file.dto";
import { createApiResponse } from "@/common/swagger/swagger-response-builder";
import { z } from "zod";
import { findByQuerySchema } from "@/schemas/find-by-query";
import { FileSchema } from "@/generated/zod";
import { zodValidation } from "@/middlewares/zod-validation";
import { authMiddleware } from "@/middlewares/auth-middleware";

const fileRouter = Router();
fileRouter.use(authMiddleware);

const TAG = "File";
const ROUTE = `/${TAG.toLowerCase()}`;

export const fileRegistry = new OpenAPIRegistry();
const fileController = new FileController();

fileRegistry.register(TAG, FileSchema);

fileRegistry.registerPath({
  method: "get",
  path: ROUTE,
  summary: `Get all ${TAG}`,
  tags: [TAG],
  responses: createApiResponse(z.array(FileSchema), "Success"),
});
fileRouter.get("/", fileController.getAll);

//====================================================================================================

fileRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/{id}`,
  tags: [TAG],
  summary: `Get ${TAG} by id`,
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: createApiResponse(FileSchema, "Success"),
});
fileRouter.get("/:id", fileController.getById);

//====================================================================================================

fileRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/user/{userId}`,
  tags: [TAG],
  summary: `Get ${TAG} by userId`,
  request: {
    params: z.object({ userId: z.string() }),
  },
  responses: createApiResponse(FileSchema, "Success"),
});
fileRouter.get("/user/:userId", fileController.getByUser);

//====================================================================================================

fileRegistry.registerPath({
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
fileRouter.post("/find", zodValidation(findByQuerySchema), fileController.findByQuery);

//====================================================================================================

fileRegistry.registerPath({
  method: "post",
  path: `${ROUTE}/upload`,
  tags: [TAG],
  summary: `Upload ${TAG}`,
  request: {
    body: {
      content: { "multipart/form-data": { schema: uploadFileSchema } },
    },
  },
  responses: createApiResponse(uploadFileSchema, "File uploaded Successfully"),
});
fileRouter.post(
  "/upload",
  uploadMiddleware,
  zodValidation(uploadFileSchema),
  fileController.upload,
);

//====================================================================================================

fileRegistry.registerPath({
  method: "put",
  path: `${ROUTE}/{id}`,
  tags: [TAG],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "multipart/form-data": { schema: updateFileSchema } },
    },
  },
  responses: createApiResponse(updateFileSchema, "File updated Successfully"),
});
fileRouter.put("/:id", uploadMiddleware, zodValidation(updateFileSchema), fileController.update);

//====================================================================================================

fileRegistry.registerPath({
  method: "delete",
  path: `${ROUTE}/{id}`,
  tags: [TAG],
  summary: `Delete ${TAG}`,
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: createApiResponse(z.null(), `${TAG} Deleted Successfully`),
});
fileRouter.delete("/:id", fileController.delete);

export default fileRouter;
