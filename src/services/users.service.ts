import { UpdateUsersDto, CreateUsersDto } from "@/schemas/users.dto";
import { env } from "@/config/env";
import { hash } from "bcryptjs";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { logger } from "@/common/winston/winston";
import { BaseService } from "@/services/base.services";
import { PrismaClient, Users } from "@prisma/client";
import { UsersRepository } from "@/repository/users.repository";
import { loggedError } from "@/utils/utils";
import { FindByQueryDto, FindByQueryResult } from "@/schemas/find-by-query";

const prisma = new PrismaClient();

export class UsersService extends BaseService<Users, CreateUsersDto, UpdateUsersDto> {
  private collectionNameService: string;
  private usersRepository: UsersRepository;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, collectionName: string, ignoreFields?: Record<string, boolean>) {
    super(model, collectionName, ignoreFields);
    this.collectionNameService = collectionName;
    this.usersRepository = new UsersRepository(model, collectionName, ignoreFields);
  }

  /**
   * Fetches all entities from the database.
   * @returns Array of entities
   */
  getAll = async (): Promise<Users[]> => {
    try {
      logger.info(
        `[${this.collectionNameService} Service] Fetching all ${this.collectionNameService}`,
      );
      const data = await this.usersRepository.getAll();
      return data;
    } catch (error) {
      loggedError(error, `[${this.collectionNameService} Service] getAll service error`);
      throw error;
    }
  };

  /**
   * Fetches a entity by their id.
   * @param id - entity's unique identifier
   * @returns entity data
   */
  getById = async (id: string): Promise<Users> => {
    try {
      logger.info(
        `[${this.collectionNameService} Service] Fetching ${this.collectionNameService} with id: ${id}`,
      );
      const data = await this.usersRepository.getById(id);

      if (!data) {
        logger.warn(
          `[${this.collectionNameService} Service] ${this.collectionNameService} with id ${id} not found`,
        );
        throw createHttpError(StatusCodes.BAD_REQUEST, `${this.collectionNameService} not found`, {
          resource: this.collectionNameService,
        });
      }

      return data;
    } catch (error) {
      loggedError(error, `[${this.collectionNameService} Service] getById service error`, { id });
      throw error;
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
        `[${this.collectionNameService} Service] Fetching ${this.collectionNameService} with email: ${email}`,
      );
      const data = await this.usersRepository.getByEmail(email);

      if (!data) {
        logger.warn(
          `[${this.collectionNameService} Service] ${this.collectionNameService} with email ${email} not found`,
        );
        return null;
      }

      return data;
    } catch (error) {
      loggedError(error, `[${this.collectionNameService} Service] getByEmail service error`, {
        email,
      });
      throw error;
    }
  };

  /**
   * Finds entities based on query parameters.
   * @param options - Query parameters like pagination, sorting, and filtering
   * @returns Paginated entity data
   */
  findByQuery = async (options: FindByQueryDto): Promise<FindByQueryResult<Users>> => {
    try {
      logger.info(
        `[${this.collectionNameService} Service] Querying ${this.collectionNameService} with options: ${JSON.stringify(options)}`,
      );
      return await this.usersRepository.findByQuery(options);
    } catch (error) {
      loggedError(error, `[${this.collectionNameService} Service] findByQuery service error`, {
        options,
      });
      throw error;
    }
  };

  /**
   * Creates a new entity.
   * @param createDto - Data for creating a new entity
   * @returns Created entity data
   */
  create = async (createDto: CreateUsersDto): Promise<Users | null> => {
    try {
      logger.info(
        `[${this.collectionNameService} Service] Creating ${this.collectionNameService} with email: ${createDto.email}`,
      );
      const data = await this.usersRepository.getByEmail(createDto.email!);

      if (data) {
        logger.warn(
          `[${this.collectionNameService} Service] ${this.collectionNameService} with email ${createDto.email} already exists`,
        );
        throw createHttpError(
          StatusCodes.BAD_REQUEST,
          `${this.collectionNameService} already exists!`,
          {
            resource: this.collectionNameService,
          },
        );
      }

      const hashedPassword = await hash(createDto.password!, env.HASH!);

      const newDto: CreateUsersDto = {
        name: createDto.name,
        email: createDto.email,
        password: hashedPassword,
      };

      if (!createDto.tenantId) {
        const defaultTenant = await prisma.tenants.findFirst({
          where: { name: "Default Tenant" },
        });
        newDto.tenantId = defaultTenant?.id;
      }

      if (!createDto.roleId) {
        const defaultRole = await prisma.roles.findFirst({
          where: { name: "user" },
        });
        newDto.roleId = defaultRole?.id;
      }

      return await this.usersRepository.create(newDto);
    } catch (error) {
      loggedError(error, `[${this.collectionNameService} Service] create service error`, {
        createDto,
      });
      throw error;
    }
  };

  /**
   * Updates an existing entity.
   * @param id - entity's unique identifier
   * @param updateDto - Data to update the entity with
   * @returns Updated entity data
   */
  update = async (id: string, updateDto: UpdateUsersDto): Promise<Users | null> => {
    try {
      logger.info(
        `[${this.collectionNameService} Service] Updating ${this.collectionNameService} with id: ${id}`,
      );
      const data = await this.getById(id);

      if (!data) {
        logger.warn(
          `[${this.collectionNameService} Service] ${this.collectionNameService} with id ${id} does not exist!`,
        );
        throw createHttpError(
          StatusCodes.BAD_REQUEST,
          `${this.collectionNameService} does not exist!`,
          {
            resource: this.collectionNameService,
          },
        );
      }

      if (updateDto.email) {
        const email = await this.usersRepository.getByEmail(updateDto.email);
        if (email) {
          logger.warn(
            `[${this.collectionNameService} Service] ${this.collectionNameService} with email ${updateDto.email} already exists`,
          );
          throw createHttpError(StatusCodes.BAD_REQUEST, "Email already exists!", {
            resource: this.collectionNameService,
          });
        }
      }

      // If (updateDto.password) {
      //   UpdateDto.password = await hash(updateDto.password, env.HASH!);
      // }

      updateDto.updatedAt = new Date();

      return await this.usersRepository.update(id, updateDto);
    } catch (error) {
      loggedError(error, `[${this.collectionNameService} Service] update service error`, {
        id,
        updateDto,
      });
      throw error;
    }
  };
}
