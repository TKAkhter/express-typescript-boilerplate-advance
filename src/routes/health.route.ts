import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { createApiResponse } from "@/common/swagger/swagger-response-builder";
import { HealthController } from "@/controllers/health.controller";
import { z } from "zod";

const healthRouter = Router();

const TAG = "Health";
const ROUTE = `/${TAG.toLowerCase()}`;

export const healthRegistry = new OpenAPIRegistry();
const healthController = new HealthController();

healthRegistry.register(TAG, z.any());

//====================================================================================================

healthRegistry.registerPath({
  method: "get",
  path: ROUTE,
  summary: "Get health check",
  tags: [TAG],
  security: [],
  responses: createApiResponse(z.any(), "Success"),
});

healthRouter.get("/", healthController.health);

//====================================================================================================

healthRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/clear-cache`,
  summary: "Clear cache",
  tags: [TAG],
  security: [],
  responses: createApiResponse(z.any(), "Success"),
});

healthRouter.get("/clear-cache", healthController.clearCache);

//====================================================================================================

healthRegistry.registerPath({
  method: "get",
  path: `${ROUTE}/clear-logs`,
  summary: "Clear log files",
  tags: [TAG],
  security: [],
  responses: createApiResponse(z.any(), "Success"),
});

healthRouter.get("/clear-logs", healthController.clearLogFiles);

export default healthRouter;
