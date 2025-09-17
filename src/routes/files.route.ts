import { Router } from "express";
import { uploadMiddleware } from "@/common/multer/multer";
import { FileController } from "@/controllers/files.controller";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { updateFilesSchema, uploadFilesSchema } from "@/schemas/files.dto";
import { createApiResponse } from "@/common/swagger/swagger-response-builder";
import { z } from "zod";
import { findByQuerySchema } from "@/schemas/find-by-query";
import { FilesSchema } from "@/generated/zod";
import { zodValidation } from "@/middlewares/zod-validation";
import { authMiddleware } from "@/middlewares/auth-middleware";
import { COLLECTION_NAMES } from "@/constants";

const fileRouter = Router();
fileRouter.use(authMiddleware);

const TAG = COLLECTION_NAMES.files;
const ROUTE = `/${TAG.toLowerCase()}`;

export const fileRegistry = new OpenAPIRegistry();
const fileController = new FileController();

fileRegistry.register(TAG, FilesSchema);

fileRegistry.registerPath({
  method: "get",
  path: ROUTE,
  summary: `Get all ${TAG}`,
  tags: [TAG],
  responses: createApiResponse(z.array(FilesSchema), "Success"),
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
  responses: createApiResponse(FilesSchema, "Success"),
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
  responses: createApiResponse(FilesSchema, "Success"),
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
      content: { "multipart/form-data": { schema: uploadFilesSchema } },
    },
  },
  responses: createApiResponse(uploadFilesSchema, "File uploaded Successfully"),
});
fileRouter.post(
  "/upload",
  uploadMiddleware,
  zodValidation(uploadFilesSchema),
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
      content: { "multipart/form-data": { schema: updateFilesSchema } },
    },
  },
  responses: createApiResponse(updateFilesSchema, "File updated Successfully"),
});
fileRouter.put("/:id", uploadMiddleware, zodValidation(updateFilesSchema), fileController.update);

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
