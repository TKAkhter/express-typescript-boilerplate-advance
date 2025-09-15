import { logger } from "@/common/winston/winston";
import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

export const prismaInstance = () => Prisma;

export const connectPrisma = async () => {
  try {
    const prisma = Prisma;
    await prisma.$connect();
  } catch (error) {
    logger.error("Error connecting to Prisma:", { error });
    throw error;
  }
};
