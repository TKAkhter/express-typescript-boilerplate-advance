import { NextFunction, Request, Response, Router } from "express";
import knex from "../../database/knex";
import redis from "../../common/redis/redis";
import mongoose from "mongoose";
import { createApiResponse } from "../../common/swagger/swagger-response-builder";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const healthCheckRouter = Router();

export const healthCheckRegistry = new OpenAPIRegistry();

healthCheckRegistry.register("HealthCheck", z.object({}));

healthCheckRegistry.registerPath({
    method: "get",
    path: "/",
    summary: "Get health check",
    tags: ["HealthCheck"],
    security: [],
    responses: createApiResponse(z.array(z.object({})), "Success"),
});

healthCheckRouter.get("/", async (_: Request, res: Response, next: NextFunction) => {
    const healthCheck = {
        pg: { status: "unknown", details: {} },
        redis: { status: "unknown", details: {} },
        mongo: { status: "unknown", details: {} },
        server: {
            status: "healthy",
            uptime: process.uptime(),
            memoryUsage: formatMemoryUsage(),
        },
    };

    try {
        // Check PostgreSQL health
        await knex.raw("SELECT 1+1 AS result");
        healthCheck.pg.status = "healthy";

        // Check Redis health
        await redis.ping();
        healthCheck.redis.status = "healthy";

        // Check Mongoose (MongoDB) health
        if (mongoose.connection.readyState === 1) {
            healthCheck.mongo.status = "healthy";
        } else {
            healthCheck.mongo.status = "unhealthy";
        }

        res.status(200).json(createHealthCheckResponse("healthy", healthCheck));
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("Mongo")) {
                healthCheck.mongo.status = "unhealthy";
            } else if (error.message.includes("Redis")) {
                healthCheck.redis.status = "unhealthy";
            } else if (error.message.includes("PostgreSQL")) {
                healthCheck.pg.status = "unhealthy";
            }
        }

        res.status(500).json(createHealthCheckResponse("unhealthy", healthCheck));
        next(error);
    }
});

const formatMemoryUsage = () => {
    const memoryUsage = process.memoryUsage();
    return {
        rss: memoryUsage.rss / 1024 / 1024,
        heapTotal: memoryUsage.heapTotal / 1024 / 1024,
        heapUsed: memoryUsage.heapUsed / 1024 / 1024,
        external: memoryUsage.external / 1024 / 1024,
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createHealthCheckResponse = (status: string, healthCheck: any) => ({
    status,
    details: healthCheck,
});