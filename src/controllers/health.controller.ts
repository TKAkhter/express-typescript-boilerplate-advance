import { NextFunction, Response } from "express";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { checkRedis, createHealthCheckResponse, formatMemoryUsage } from "@/helpers/health.helper";
import { StatusCodes } from "http-status-codes";
import fs from "fs";
import { env } from "@/config/env";
import path from "path";
import { RedisClient } from "@/config/redis/redis";

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
  health = async (_: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
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

      res
        .status(overallStatus === "healthy" ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR)
        .json(createHealthCheckResponse(overallStatus, healthCheck));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`${this.logFileName} health API error`, {
          error: error.message,
        });
      } else {
        logger.warn(`${this.logFileName} health API error: Unknown error occurred`);
      }
      next(error);
    }
  };

  /**
   * * Clear Redis API cache.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  clearCache = async (_: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
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
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`${this.logFileName} clearCache API error`, {
          error: error.message,
        });
      } else {
        logger.warn(`${this.logFileName} clearCache API error: Unknown error occurred`);
      }
      next(error);
    }
  };

  /**
   * Handles health of server.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  clearLogFiles = async (_: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!fs.existsSync(env.LOGS_DIRECTORY)) {
        fs.mkdirSync(env.LOGS_DIRECTORY);
      }

      const files = fs.readdirSync(env.LOGS_DIRECTORY);

      files.forEach((file) => {
        const filePath = path.join(env.LOGS_DIRECTORY, file);
        fs.unlinkSync(filePath);
      });

      res.json({ message: "All log files have been cleared." });
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`${this.logFileName} clearLogFiles API error`, {
          error: error.message,
        });
      } else {
        logger.warn(`${this.logFileName} clearLogFiles API error: Unknown error occurred`);
      }
      next(error);
    }
  };
}
