import { RedisClient } from "@/config/redis/redis";

export const checkRedis = async () => {
  try {
    const redis = RedisClient.getInstance();
    await redis.ping();
    return { status: "healthy", details: {} };
  } catch (error) {
    if (error instanceof Error) {
      return { status: "unhealthy", details: { error: error.message } };
    }
    return { status: "unhealthy", details: { error: "Unknown error occurred" } };
  }
};

export const formatMemoryUsage = () => {
  const memoryUsage = process.memoryUsage();
  return {
    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
  };
};
