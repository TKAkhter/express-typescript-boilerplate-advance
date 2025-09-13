import { NextFunction, Response } from "express";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { checkRedis, formatMemoryUsage } from "@/helpers/health.helper";
import fs from "fs";
import { env } from "@/config/env";
import path from "path";
import { RedisClient } from "@/config/redis/redis";
import { loggedError } from "@/utils/utils";
import { createResponse } from "@/utils/create-response";

export class HealthController {
  private logFileName: string;

  constructor() {
    this.logFileName = "[Auth Controller]";
  }

  /**
   * Handles health of server.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  health = async (_: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const healthCheck = {
        redis: await checkRedis(),
        server: {
          status: "healthy",
          uptime: process.uptime(),
          memoryUsage: formatMemoryUsage(),
        },
      };

      const overallStatus = Object.values(healthCheck)
        .map((service) => service.status)
        .includes("unhealthy")
        ? "unhealthy"
        : "healthy";

      const data = { status: overallStatus, details: healthCheck };
      res.json(createResponse({ data, message: overallStatus }));
    } catch (error) {
      loggedError(error, `${this.logFileName} health API error`);
      next(error);
    }
  };

  /**
   * * Clear Redis API cache.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  clearCache = async (_: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const redis = RedisClient.getInstance();
      const stream = redis.scanStream({
        match: "apiResponseCache*", // Pattern to match keys
        count: 100, // Process 100 keys per iteration
      });

      const keysToDelete: string[] = [];

      for await (const keys of stream) {
        keysToDelete.push(...keys);
      }

      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
        logger.info(`Cleared ${keysToDelete.length} keys with prefix apiResponseCache`);
      } else {
        logger.info("No keys found with prefix apiResponseCache");
      }

      const data = { message: "Cache cleared successfully" };
      res.json(createResponse({ data, message: data.message }));
    } catch (error) {
      loggedError(error, `${this.logFileName} clearCache API error`);
      next(error);
    }
  };

  /**
   * Handles health of server.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  clearLogFiles = async (_: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!fs.existsSync(env.LOGS_DIRECTORY)) {
        fs.mkdirSync(env.LOGS_DIRECTORY);
      }

      const files = fs.readdirSync(env.LOGS_DIRECTORY);

      files.forEach((file) => {
        const filePath = path.join(env.LOGS_DIRECTORY, file);
        fs.unlinkSync(filePath);
      });

      const data = { message: "All log files have been cleared." };
      res.json(createResponse({ data, message: data.message }));
    } catch (error) {
      loggedError(error, `${this.logFileName} clearLogFiles API error`);
      next(error);
    }
  };
}
