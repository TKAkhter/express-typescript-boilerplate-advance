import { NextFunction, Response } from "express";
import { UsersService } from "@/services/users.service";
import { StatusCodes } from "http-status-codes";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { createResponse } from "@/utils/create-response";
import { BaseController } from "@/controllers/base.controller";
import { CreateUsersDto, UpdateUsersDto } from "@/schemas/users.dto";
import { Files, Users } from "@prisma/client";
import { prismaInstance } from "@/config/prisma/prisma";
import { FileService } from "../services/files.service";
import { deleteFileFromDisk } from "@/common/multer/delete-file-from-disk";
import { loggedError } from "@/utils/utils";
import { COLLECTION_NAMES } from "@/constants";

const prisma = prismaInstance();
const IGNORE_FIELDS = { password: true };

export class UserController extends BaseController<Users, CreateUsersDto, UpdateUsersDto> {
  public collectionName: string;
  public userService: UsersService;
  public fileService: FileService;

  constructor() {
    super(prisma.users, COLLECTION_NAMES.users, IGNORE_FIELDS);
    this.collectionName = COLLECTION_NAMES.users;
    this.userService = new UsersService(prisma.users, this.collectionName, IGNORE_FIELDS);
    this.fileService = new FileService(prisma.files, COLLECTION_NAMES.files, {});
  }

  /**
   * Get all entities objects
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON list of entities
   */
  getAll = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { loggedUser } = req;
    try {
      logger.info(`[${this.collectionName} Controller] Fetching all ${this.collectionName}`, {
        loggedUser,
      });
      const data = await this.userService.getAll();

      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] getAll API error`, { loggedUser });
      next(error);
    }
  };

  /**
   * Get entity by ID
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON entity object
   */
  getById = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { loggedUser } = req;
    const { id } = req.params;
    try {
      logger.info(`[${this.collectionName} Controller] Fetching ${this.collectionName} by ID`, {
        id,
        loggedUser,
      });
      const data = await this.userService.getById(id);

      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] getById API error`, {
        id,
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Get entity by email
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON entity object
   */
  getByEmail = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { loggedUser } = req;
    const { email } = req.params;
    try {
      logger.info(`[${this.collectionName} Controller] Fetching ${this.collectionName} by email`, {
        email,
        loggedUser,
      });
      const data = await this.userService.getByEmail(email);

      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] getByEmail API error`, {
        email,
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Find entities by query (pagination, sorting, filtering)
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON result of the query
   */
  findByQuery = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { loggedUser } = req;
    const { paginate, orderBy, filter } = req.body;
    try {
      const queryOptions = { paginate, orderBy, filter };
      logger.info(`[${this.collectionName} Controller] Finding ${this.collectionName} by query`, {
        queryOptions,
        loggedUser,
      });

      const data = await this.userService.findByQuery(queryOptions);

      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] findByQuery API error`, {
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Create a new entity
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON created entity
   */
  create = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const createDto = req.body;
    const { loggedUser } = req;
    try {
      logger.info(`[${this.collectionName} Controller] Creating new ${this.collectionName}`, {
        loggedUser,
        createDto,
      });
      const created = await this.userService.create(createDto);
      res.json(createResponse({ data: created, status: StatusCodes.CREATED }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] create API error`, {
        loggedUser,
        createDto,
      });
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
  update = async (req: CustomRequest, res: Response, next: NextFunction) => {
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
      res.json(createResponse({ data: updatedData }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] update API error`, {
        id,
        loggedUser,
        updateDto,
      });
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
  delete = async (req: CustomRequest, res: Response, next: NextFunction) => {
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

      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] delete API error`, {
        id,
        loggedUser,
      });
      next(error);
    }
  };
}
