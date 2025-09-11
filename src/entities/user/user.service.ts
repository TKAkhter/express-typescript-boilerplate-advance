import { UpdateUserDto, CreateUserDto } from "@/entities/user/user.dto";
import { env } from "@/config/env";
import { hash } from "bcryptjs";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { logger } from "@/common/winston/winston";
import { BaseService } from "@/common/base/base.services";
import { User } from "@prisma/client";

export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  private collectionNameService: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, collectionName: string, ignoreFields?: Record<string, boolean>) {
    super(model, collectionName, ignoreFields);
    this.collectionNameService = collectionName;
  }

  /**
   * Creates a new entity.
   * @param createDto - Data for creating a new entity
   * @returns Created entity data
   */
  create = async (createDto: CreateUserDto): Promise<User | null> => {
    try {
      logger.info(
        `[${this.collectionNameService} Service] Creating ${this.collectionNameService} with email: ${createDto.email}`,
      );
      const data = await this.baseRepository.getByEmail(createDto.email!);

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

      const newDto = {
        name: createDto.name,
        email: createDto.email,
        password: hashedPassword,
      };

      return await this.baseRepository.create(newDto);
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        logger.warn(
          `[${this.collectionNameService} Service] Error creating ${this.collectionNameService}`,
          {
            createDto,
            error: error.message,
          },
        );
        throw new Error(`Error creating ${this.collectionNameService}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionNameService} Service] Unknown error occurred while creating ${this.collectionNameService}`,
      );
      throw new Error(`Unknown error occurred while creating ${this.collectionNameService}`);
    }
  };

  /**
   * Updates an existing entity.
   * @param id - entity's unique identifier
   * @param updateDto - Data to update the entity with
   * @returns Updated entity data
   */
  update = async (id: string, updateDto: UpdateUserDto): Promise<User | null> => {
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
        const email = await this.baseRepository.getByEmail(updateDto.email);
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

      return await this.baseRepository.update(id, updateDto);
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        logger.warn(
          `[${this.collectionNameService} Service] Error updating ${this.collectionNameService}`,
          {
            id,
            updateDto,
            error: error.message,
          },
        );
        throw new Error(`Error updating ${this.collectionNameService}: ${error.message}`);
      }
      logger.warn(
        `[${this.collectionNameService} Service] Unknown error occurred while updating ${this.collectionNameService}`,
      );
      throw new Error(`Unknown error occurred while updating ${this.collectionNameService}`);
    }
  };
}
