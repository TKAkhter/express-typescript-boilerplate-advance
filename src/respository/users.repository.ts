// Users-repository.ts
import { Users } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { CreateUsersDto, UpdateUsersDto } from "@/schemas/users.dto";
import { logger } from "@/common/winston/winston";
import { formatPrismaError } from "@/config/prisma/errors.prisma";
import { loggedError } from "@/utils/utils";
export class UsersRepository extends BaseRepository<Users, CreateUsersDto, UpdateUsersDto> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private userModel: any;
  private userCollectionName: string;
  private userIgnoreFields: Record<string, boolean>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, collectionName: string, ignoreFields: Record<string, boolean> = {}) {
    super(model, "Users");
    this.userModel = model;
    this.userCollectionName = collectionName;
    this.userIgnoreFields = ignoreFields;
  }

  /**
   * Fetches all entities from the collection.
   * @returns Array of entities
   */
  getAll = async (): Promise<Users[]> => {
    try {
      logger.info(
        `[${this.userCollectionName} Repository] Fetching all from ${this.userCollectionName}`,
      );
      const getAll = await this.userModel.findMany({
        omit: this.userIgnoreFields,
        include: {
          role: true,
          tenant: true,
        },
      });
      return getAll;
    } catch (error) {
      loggedError(
        error,
        `[${this.userCollectionName} Repository] Error fetching all from ${this.userCollectionName}`,
      );
      throw new Error(formatPrismaError(error));
    }
  };

  /**
   * Fetches an entity by ID.
   * @param id - Entity's unique identifier
   * @returns Entity data or null if not found
   */
  getById = async (id: string): Promise<Users | null> => {
    try {
      logger.info(
        `[${this.userCollectionName} Repository] Fetching ${this.userCollectionName} with id: ${id}`,
      );
      return await this.userModel.findUnique({
        where: { id },
        omit: this.userIgnoreFields,
        include: {
          role: true,
          tenant: true,
        },
      });
    } catch (error) {
      loggedError(
        error,
        `[${this.userCollectionName} Repository] Error fetching ${this.userCollectionName} by id`,
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
  getByUser = async (userId: string): Promise<Users | Users[] | null> => {
    try {
      logger.info(
        `[${this.userCollectionName} Repository] Fetching ${this.userCollectionName} with userId: ${userId}`,
      );
      return await this.userModel.findMany({
        where: { userId },
        omit: this.userIgnoreFields,
        include: {
          role: true,
          tenant: true,
        },
      });
    } catch (error) {
      loggedError(
        error,
        `[${this.userCollectionName} Repository] Error fetching ${this.userCollectionName} by userId`,
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
  getByEmail = async (email: string): Promise<Users | null> => {
    try {
      logger.info(
        `[${this.userCollectionName} Repository] Fetching ${this.userCollectionName} with email: ${email}`,
      );
      return await this.userModel.findFirst({
        where: { email },
        include: {
          role: true,
          tenant: true,
        },
      });
    } catch (error) {
      loggedError(
        error,
        `[${this.userCollectionName} Repository] Error fetching ${this.userCollectionName} by email`,
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
  getByField = async (field: string, value: string | number): Promise<Users | null> => {
    try {
      logger.info(
        `[${this.userCollectionName} Repository] Fetching ${this.userCollectionName} where ${field}: ${value}`,
      );
      return await this.userModel.findMany({
        where: { [field]: value },
        omit: this.userIgnoreFields,
        include: {
          role: true,
          tenant: true,
        },
      });
    } catch (error) {
      loggedError(
        error,
        `[${this.userCollectionName} Repository] Error fetching ${this.userCollectionName} by ${field}`,
        { field, value },
      );
      throw new Error(formatPrismaError(error));
    }
  };
}
