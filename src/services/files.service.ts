import createHttpError from "http-errors";
import { logger } from "@/common/winston/winston";
import { BaseService } from "@/services/base.services";
import { UpdateFileDto, UploadFileDto } from "../schemas/files.dto";
import { Files } from "@prisma/client";

export class FileService extends BaseService<Files, UploadFileDto, UpdateFileDto> {
  private collectionNameService: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, collectionName: string, ignoreFields?: Record<string, boolean>) {
    super(model, collectionName, ignoreFields);
    this.collectionNameService = collectionName;
  }

  /**
   * Fetches a entity by their userId.
   * @param userId - entity's userId
   * @returns entity data or false if not found
   */
  getByUser = async (userId: string): Promise<Files | Files[] | false> => {
    try {
      logger.info(
        `[${this.collectionNameService} Service] Fetching ${this.collectionNameService} with userId: ${userId}`,
      );
      const data = await this.baseRepository.getByUser(userId);

      if (!data) {
        logger.warn(
          `[${this.collectionNameService} Service] ${this.collectionNameService} with userId ${userId} not found`,
        );
        return false;
      }

      return data;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      if (error instanceof Error) {
        logger.warn(
          `[${this.collectionNameService} Service] Error fetching ${this.collectionNameService} by userId`,
          {
            userId,
            error: error.message,
          },
        );
        throw new Error(`Error fetching ${this.collectionNameService} by email: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionNameService} Service] Unknown error occurred while fetching ${this.collectionNameService} by email`,
      );
      throw new Error(
        `Unknown error occurred while fetching ${this.collectionNameService} by email`,
      );
    }
  };
}
