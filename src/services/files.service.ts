import { logger } from "@/common/winston/winston";
import { BaseService } from "@/services/base.services";
import { UpdateFileDto, UploadFileDto } from "../schemas/files.dto";
import { Files } from "@prisma/client";
import { loggedError } from "@/utils/utils";

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
      loggedError(error, `[${this.collectionNameService} Service] getByUser service error`, {
        userId,
      });
      throw error;
    }
  };
}
