import { NextFunction, Response } from "express";
import { UserService } from "@/entities/user/user.service";
import { StatusCodes } from "http-status-codes";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { createResponse } from "@/utils/create-response";
import { BaseController } from "@/common/base/base.controller";
import { CreateUserDto, UpdateUserDto } from "@/entities/user/user.dto";
import { File, User } from "@prisma/client";
import { prismaInstance } from "@/config/prisma/prisma";
import { FileService } from "../file/file.service";
import { deleteFileFromDisk } from "@/common/multer/delete-file-from-disk";

const prisma = prismaInstance();
const IGNORE_FIELDS = { password: true };

export class UserController extends BaseController<User, CreateUserDto, UpdateUserDto> {
  public collectionName: string;
  public userService: UserService;
  public fileService: FileService;

  constructor() {
    super(prisma.user, "User", IGNORE_FIELDS);
    this.collectionName = "User";
    this.userService = new UserService(prisma.user, this.collectionName, IGNORE_FIELDS);
    this.fileService = new FileService(prisma.file, "Files", {});
  }

  /**
   * Create a new entity
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON created entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create = async (req: CustomRequest, res: Response, next: NextFunction): Promise<any> => {
    const createDto = req.body;
    const { loggedUser } = req;
    try {
      logger.info(`[${this.collectionName} Controller] Creating new ${this.collectionName}`, {
        loggedUser,
        createDto,
      });
      const created = await this.userService.create(createDto);
      return res.json(createResponse({ data: created, status: StatusCodes.CREATED }));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Controller] Error creating ${this.collectionName}`, {
          error: error.message,
          loggedUser,
          createDto,
        });
      }
      next(error);
    }
  };

  /**
   * Update an existing entity
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON updated entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update = async (req: CustomRequest, res: Response, next: NextFunction): Promise<any> => {
    const { id } = req.params;
    const updateDto = req.body;
    const { loggedUser } = req;
    try {
      logger.info(`[${this.collectionName} Controller] Updating ${this.collectionName}`, {
        loggedUser,
        id,
        updateDto,
      });
      const updatedData = await this.userService.update(id, updateDto);
      return res.json(createResponse({ data: updatedData, status: StatusCodes.CREATED }));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Controller] Error updating ${this.collectionName}`, {
          error: error.message,
          loggedUser,
          id,
          updateDto,
        });
      }
      next(error);
    }
  };

  /**
   * Delete a entity by ID
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON success message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete = async (req: CustomRequest, res: Response, next: NextFunction): Promise<any> => {
    const { loggedUser } = req;
    const { id } = req.params;
    try {
      logger.info(`[${this.collectionName} Controller] Deleting ${this.collectionName} by id`, {
        id,
        loggedUser,
      });

      const files = await this.fileService.getByUser(id);

      if (Array.isArray(files) && files.length > 0) {
        (files as File[]).map(async (file: File) => {
          const fileName = file.path!.split("/").pop();
          await deleteFileFromDisk(fileName!);
        });
        await this.fileService.deleteMany((files as File[]).map((file: File) => file.id));
      }

      const data = await this.baseService.delete(id);

      return res.json(createResponse({ data }));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`[${this.collectionName} Controller] Error deleting ${this.collectionName}`, {
          error: error.message,
          id,
          loggedUser,
        });
      }
      next(error);
    }
  };
}
