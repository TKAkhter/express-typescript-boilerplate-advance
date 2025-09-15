import { BaseRepository } from "@/respository/base.repository";
import { FindByQueryDto, FindByQueryResult, ImportResult } from "@/schemas/find-by-query";
import { logger } from "@/common/winston/winston";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { parseAsync } from "json2csv";

export class BaseService<T, TCreateDto, TUpdateDto> {
  private collectionName: string;
  protected baseRepository: BaseRepository<T, TCreateDto, TUpdateDto>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, collectionName: string, ignoreFields?: Record<string, boolean>) {
    this.collectionName = collectionName;
    this.baseRepository = new BaseRepository<T, TCreateDto, TUpdateDto>(
      model,
      collectionName,
      ignoreFields,
    );
  }

  /**
   * Fetches all entities from the database.
   * @returns Array of entities
   */
  getAll = async (): Promise<T[]> => {
    try {
      logger.info(`[${this.collectionName} Service] Fetching all ${this.collectionName}`);
      const data = await this.baseRepository.getAll();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Service] Error fetching all ${this.collectionName}`, {
          error: error.message,
        });
        throw new Error(`Error fetching ${this.collectionName}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while fetching all ${this.collectionName}`,
      );
      throw new Error(`Unknown error occurred while fetching ${this.collectionName}`);
    }
  };

  /**
   * Fetches a entity by their id.
   * @param id - entity's unique identifier
   * @returns entity data
   */
  getById = async (id: string): Promise<T> => {
    try {
      logger.info(
        `[${this.collectionName} Service] Fetching ${this.collectionName} with id: ${id}`,
      );
      const data = await this.baseRepository.getById(id);

      if (!data) {
        logger.warn(
          `[${this.collectionName} Service] ${this.collectionName} with id ${id} not found`,
        );
        throw createHttpError(StatusCodes.BAD_REQUEST, `${this.collectionName} not found`, {
          resource: this.collectionName,
        });
      }

      return data;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      if (error instanceof Error) {
        logger.warn(
          `[${this.collectionName} Service] Error fetching ${this.collectionName} by id`,
          {
            id,
            error: error.message,
          },
        );
        throw new Error(`Error fetching ${this.collectionName} by id: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while fetching ${this.collectionName} by id`,
      );
      throw new Error(`Unknown error occurred while fetching ${this.collectionName} by id`);
    }
  };

  /**
   * Fetches a entity by their email.
   * @param email - entity's email
   * @returns entity data or false if not found
   */
  getByEmail = async (email: string): Promise<T | false> => {
    try {
      logger.info(
        `[${this.collectionName} Service] Fetching ${this.collectionName} with email: ${email}`,
      );
      const data = await this.baseRepository.getByEmail(email);

      if (!data) {
        logger.warn(
          `[${this.collectionName} Service] ${this.collectionName} with email ${email} not found`,
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
          `[${this.collectionName} Service] Error fetching ${this.collectionName} by email`,
          {
            email,
            error: error.message,
          },
        );
        throw new Error(`Error fetching ${this.collectionName} by email: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while fetching ${this.collectionName} by email`,
      );
      throw new Error(`Unknown error occurred while fetching ${this.collectionName} by email`);
    }
  };

  /**
   * Finds entities based on query parameters.
   * @param options - Query parameters like pagination, sorting, and filtering
   * @returns Paginated entity data
   */
  findByQuery = async (options: FindByQueryDto): Promise<FindByQueryResult<T>> => {
    try {
      logger.info(
        `[${this.collectionName} Service] Querying ${this.collectionName} with options: ${JSON.stringify(options)}`,
      );
      return await this.baseRepository.findByQuery(options);
    } catch (error) {
      logger.warn(`[${this.collectionName} Service] Error querying ${this.collectionName}`, {
        options,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(`Error querying ${this.collectionName}`);
    }
  };

  /**
   * Creates a new entity.
   * @param createDto - Data for creating a new entity
   * @returns Created entity data
   */
  create = async (createDto: TCreateDto): Promise<T | null> => {
    try {
      logger.info(`[${this.collectionName} Service] Creating ${this.collectionName} ${createDto}`);
      return await this.baseRepository.create(createDto);
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Service] Error creating ${this.collectionName}`, {
          createDto,
          error: error.message,
        });
        throw new Error(`Error creating ${this.collectionName}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while creating ${this.collectionName}`,
      );
      throw new Error(`Unknown error occurred while creating ${this.collectionName}`);
    }
  };

  /**
   * Updates an existing entity.
   * @param id - entity's unique identifier
   * @param updateDto - Data to update the entity with
   * @returns Updated entity data
   */
  update = async (id: string, updateDto: TUpdateDto): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Service] Updating ${this.collectionName} with id: ${id}`,
      );
      return await this.baseRepository.update(id, updateDto);
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Service] Error updating ${this.collectionName}`, {
          id,
          updateDto,
          error: error.message,
        });
        throw new Error(`Error updating ${this.collectionName}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while updating ${this.collectionName}`,
      );
      throw new Error(`Unknown error occurred while updating ${this.collectionName}`);
    }
  };

  /**
   * Deletes a entity.
   * @param id - entity's unique identifier
   * @returns Deletion result
   */
  delete = async (id: string): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Service] Deleting ${this.collectionName} with id: ${id}`,
      );
      const data = await this.getById(id);

      if (!data) {
        logger.warn(
          `[${this.collectionName} Service] ${this.collectionName} with id ${id} does not exist!`,
        );
        throw createHttpError(StatusCodes.BAD_REQUEST, `${this.collectionName} does not exist!`, {
          resource: this.collectionName,
        });
      }

      return await this.baseRepository.delete(id);
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Service] Error deleting ${this.collectionName}`, {
          id,
          error: error.message,
        });
        throw new Error(`Error deleting ${this.collectionName}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while deleting ${this.collectionName}`,
      );
      throw new Error(`Unknown error occurred while deleting ${this.collectionName}`);
    }
  };

  /**
   * Deletes multiple entities by their ids.
   * @param ids - List of entity ids to delete
   * @returns Deletion result
   */
  deleteMany = async (ids: string[]): Promise<{ deletedCount: number }> => {
    if (!Array.isArray(ids) || ids.length === 0) {
      logger.warn(`[${this.collectionName} Service] Invalid array of ids for bulk delete`);
      throw new Error("Invalid array of ids");
    }

    const result = await this.baseRepository.deleteMany(ids);

    if (result.deletedCount === 0) {
      logger.warn(`[${this.collectionName} Service] No ${this.collectionName} found to delete`, {
        ids,
      });
      throw new Error(`No ${this.collectionName} found to delete`);
    }

    return result;
  };

  /**
   * Import entities.
   * @param importDto - Data for creating entities
   * @param accountId - account id for creating entities
   * @returns number of imported entities
   */
  import = async (importDto: TCreateDto[]): Promise<ImportResult<T>> => {
    try {
      logger.info(`[${this.collectionName} Service] Starting import ${this.collectionName}`);

      const imported = await this.baseRepository.import(importDto);

      logger.info(
        `[${this.collectionName} Service] ${imported.createdCount} completed, ${imported.skippedCount} skipped for ${this.collectionName}`,
      );

      return imported;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Service] Error creating ${this.collectionName}`, {
          importDto,
          error: error.message,
        });
        throw new Error(`Error creating ${this.collectionName}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while creating ${this.collectionName}`,
      );
      throw new Error(`Unknown error occurred while creating ${this.collectionName}`);
    }
  };

  /**
   * Export entities from the database.
   * @returns csv of entities
   */
  export = async (): Promise<string> => {
    try {
      logger.info(`[${this.collectionName} Service] Fetching all ${this.collectionName}`);
      const data = await this.baseRepository.getAll();

      if (data.length === 0) {
        throw createHttpError(StatusCodes.NOT_FOUND, `No ${this.collectionName} found to export`);
      }

      const csv = await parseAsync(data);

      return csv;
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Service] Error fetching all ${this.collectionName}`, {
          error: error.message,
        });
        throw new Error(`Error fetching ${this.collectionName}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionName} Service] Unknown error occurred while fetching all ${this.collectionName}`,
      );
      throw new Error(`Unknown error occurred while fetching ${this.collectionName}`);
    }
  };
}
