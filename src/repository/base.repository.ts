import { FindByQueryDto, FindByQueryResult, ImportResult } from "@/schemas/find-by-query";
import { logger } from "@/common/winston/winston";
import { formatPrismaError } from "@/config/prisma/errors.prisma";
import { loggedError } from "@/utils/utils";

export class BaseRepository<T, TCreateDto, TUpdateDto> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;
  private collectionName: string;
  private ignoreFields: Record<string, boolean>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, collectionName: string, ignoreFields: Record<string, boolean> = {}) {
    this.model = model;
    this.collectionName = collectionName;
    this.ignoreFields = ignoreFields;
  }

  /**
   * Fetches all entities from the collection.
   * @returns Array of entities
   */
  getAll = async (): Promise<T[]> => {
    try {
      logger.info(`[${this.collectionName} Repository] Fetching all from ${this.collectionName}`);
      const getAll = await this.model.findMany({ omit: this.ignoreFields });
      return getAll;
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error fetching all from ${this.collectionName}`,
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Fetches an entity by ID.
   * @param id - Entity's unique identifier
   * @returns Entity data or null if not found
   */
  getById = async (id: string): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Fetching ${this.collectionName} with id: ${id}`,
      );
      return await this.model.findUnique({ where: { id }, omit: this.ignoreFields });
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error fetching ${this.collectionName} by id`,
        { id },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Fetches a entity or entities by their userId.
   * @param id - entity's unique identifier
   * @returns entity data or null if not found
   */
  getByUser = async (userId: string): Promise<T | T[] | null> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Fetching ${this.collectionName} with userId: ${userId}`,
      );
      return await this.model.findMany({ where: { userId }, omit: this.ignoreFields });
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error fetching ${this.collectionName} by userId`,
        { userId },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Fetches a entity by their email.
   * @param email - entity's email
   * @returns entity data or null if not found
   */
  getByEmail = async (email: string): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Fetching ${this.collectionName} with email: ${email}`,
      );
      return await this.model.findFirst({ where: { email } });
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error fetching ${this.collectionName} by email`,
        { email },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Fetches a document based on a specified field and its value.
   * @param field - The field name to search by.
   * @param value - The value to match for the specified field.
   * @returns The matched document or null if not found.
   */
  getByField = async (field: string, value: string | number): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Fetching ${this.collectionName} where ${field}: ${value}`,
      );
      return await this.model.findMany({ where: { [field]: value }, omit: this.ignoreFields });
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error fetching ${this.collectionName} by ${field}`,
        { field, value },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Finds entities with pagination.
   * @param options - Query options
   * @returns Paginated data
   */
  findByQuery = async (options: FindByQueryDto): Promise<FindByQueryResult<T>> => {
    const { filter = {}, paginate = { page: 1, perPage: 10 }, orderBy = [] } = options;
    const { page, perPage } = paginate;

    try {
      const sortOptions = orderBy.reduce(
        (acc, { sort, order }) => {
          acc[sort] = order;
          return acc;
        },
        {} as Record<string, "asc" | "desc">,
      );

      const [data, total] = await Promise.all([
        this.model.findMany({
          where: filter,
          orderBy: sortOptions,
          skip: (page - 1) * perPage,
          take: perPage,
          omit: this.ignoreFields,
        }),
        this.model.count({ where: filter }),
      ]);

      return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error querying ${this.collectionName}`,
        { options },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Creates a new entity.
   * @param createDto - Data for creating a new entity
   * @returns Created entity data
   */
  create = async (createDto: TCreateDto): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Creating document in ${this.collectionName}`,
      );
      const created = await this.model.create({ data: createDto });
      return created;
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error creating entry in ${this.collectionName}`,
        { createDto },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Updates an existing entity.
   * @param id - Entity's unique identifier
   * @param updateDto - Data to update the entity
   * @returns Updated entity data
   */
  update = async (id: string, updateDto: TUpdateDto): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Updating ${this.collectionName} with id: ${id}`,
      );
      return await this.model.update({ where: { id }, data: updateDto });
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error updating ${this.collectionName}`,
        { id, updateDto },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Deletes an entity by id.
   * @param id - Entity's unique identifier
   * @returns Deleted entity data
   */
  delete = async (id: string): Promise<T | null> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Deleting ${this.collectionName} with id: ${id}`,
      );
      return await this.model.delete({ where: { id } });
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error deleting ${this.collectionName}`,
        { id },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Deletes multiple entities by their ids.
   * @param ids - List of entity ids to delete
   * @returns Deletion result
   */
  deleteMany = async (ids: string[]): Promise<{ deletedCount: number }> => {
    try {
      const result = await this.model.deleteMany({ where: { id: { in: ids } } });
      return { deletedCount: result.count };
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error deleting multiple ${this.collectionName}`,
        { ids },
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Imports multiple entity objects into the database.
   * Skips objects where email already exist in the database.
   * @param entities - Array of entity objects to be saved
   * @returns Object containing created entities, created count, and skipped count
   */
  import = async (entities: TCreateDto[]): Promise<ImportResult<T>> => {
    try {
      logger.info(
        `[${this.collectionName} Repository] Importing ${entities.length} documents into ${this.collectionName}`,
      );

      const uniqueEntities = [];
      const skippedEntities = [];
      let createdEntities = [];

      for (const entity of entities) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await this.model.findFirst({
          where: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            OR: [{ email: (entity as any).email }],
          },
        });

        if (exists) {
          skippedEntities.push(entity);
        } else {
          uniqueEntities.push(entity);
        }
      }
      if (uniqueEntities.length !== 0) {
        createdEntities = await this.model.createMany({
          data: uniqueEntities,
        });
      }

      logger.info(`[${this.collectionName} Repository] Import Summary:`, {
        createdEntities: uniqueEntities,
        createdCount: createdEntities.count ?? createdEntities.length,
        skippedCount: skippedEntities.length,
      });

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdEntities: uniqueEntities as any,
        createdCount: createdEntities.count ?? createdEntities.length,
        skippedCount: skippedEntities.length,
      };
    } catch (error) {
      loggedError(
        error,
        `[${this.collectionName} Repository] Error importing into ${this.collectionName}`,
        { totalEntities: entities.length },
      );
      throw new Error(formatPrismaError(error));
    }
  };
}
