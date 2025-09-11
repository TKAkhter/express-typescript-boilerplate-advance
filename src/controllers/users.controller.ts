import { NextFunction, Response } from "express";
import { UsersService } from "@/services/users.service";
import { StatusCodes } from "http-status-codes";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { createResponse } from "@/utils/create-response";
import { BaseController } from "@/common/base/base.controller";
import { CreateUsersDto, UpdateUsersDto } from "@/schemas/users.dto";
import { Files, Users } from "@prisma/client";
import { prismaInstance } from "@/config/prisma/prisma";
import { FileService } from "../services/files.service";
import { deleteFileFromDisk } from "@/common/multer/delete-file-from-disk";

const prisma = prismaInstance();
const IGNORE_FIELDS = { password: true };

export class UserController extends BaseController<Users, CreateUsersDto, UpdateUsersDto> {
  public collectionName: string;
  public userService: UsersService;
  public fileService: FileService;

  constructor() {
    super(prisma.users, "Users", IGNORE_FIELDS);
    this.collectionName = "Users";
    this.userService = new UsersService(prisma.users, this.collectionName, IGNORE_FIELDS);
    this.fileService = new FileService(prisma.files, "Files", {});
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
        (files as Files[]).map(async (file: Files) => {
          const fileName = file.path!.split("/").pop();
          await deleteFileFromDisk(fileName!);
        });
        await this.fileService.deleteMany((files as Files[]).map((file: Files) => file.id));
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
