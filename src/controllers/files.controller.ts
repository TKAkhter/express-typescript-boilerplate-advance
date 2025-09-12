import { NextFunction, Response } from "express";
import { UpdateFileDto, UploadFileDto } from "@/schemas/files.dto";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { saveFileToDisk } from "@/common/multer/save-file-to-disk";
import { updateFileToDisk } from "@/common/multer/update-file-to-disk";
import { deleteFileFromDisk } from "@/common/multer/delete-file-from-disk";
import { BaseController } from "@/controllers/base.controller";
import { createResponse } from "@/utils/create-response";
import { StatusCodes } from "http-status-codes";
import { FileService } from "@/services/files.service";
import { Files } from "@prisma/client";
import { prismaInstance } from "@/config/prisma/prisma";
import _ from "lodash";

const prisma = prismaInstance();
const IGNORE_FIELDS = {};

export class FileController extends BaseController<Files, UploadFileDto, UpdateFileDto> {
  public collectionName: string;
  public fileService: FileService;

  constructor() {
    super(prisma.files, "Files", IGNORE_FIELDS);
    this.collectionName = "Files";
    this.fileService = new FileService(prisma.files, this.collectionName, IGNORE_FIELDS);
  }

  /**
   * Get entity by ID
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON entity object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getByUser = async (req: CustomRequest, res: Response, next: NextFunction): Promise<any> => {
    const { userId } = req.params;
    const { loggedUser } = req;
    try {
      logger.info(`[${this.collectionName} Controller] Fetching ${this.collectionName} by userId`, {
        loggedUser,
        userId,
      });
      const data = await this.fileService.getByUser(userId);

      return res.json(createResponse({ data }));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(
          `[${this.collectionName} Controller] Error fetching ${this.collectionName} by userId`,
          {
            error: error.message,
            loggedUser,
            userId,
          },
        );
      }
      next(error);
    }
  };

  /**
   * Upload an entity
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON updated entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload = async (req: CustomRequest, res: Response, next: NextFunction): Promise<any> => {
    const { loggedUser } = req;
    try {
      const { tags, userId, name, views } = req.body;

      const { path } = await saveFileToDisk(req.file);
      logger.info(`[${this.collectionName} Controller] Creating new ${this.collectionName}`, {
        loggedUser,
        tags,
        name,
        path,
      });

      const fileUpload = {
        name,
        path,
        userId,
        tags,
        views: views ?? 0,
      };
      const created = await this.baseService.create(fileUpload);

      return res.json(createResponse({ data: created, status: StatusCodes.CREATED }));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn("Error uploading file", { error: error.message, loggedUser });
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
    const { loggedUser } = req;
    const { id } = req.params;
    try {
      const updateData = req.body;
      const existFile = await this.baseService.getById(id);
      if (!existFile) {
        throw new Error("File not found");
      }
      const fileName = existFile.path!.split("/").pop();
      if (req.file) {
        await updateFileToDisk(fileName!, req.file);
      }
      const fileData = {
        name: _.isEmpty(updateData.name) ? existFile.name : updateData.name,
        userId: _.isEmpty(updateData.userId) ? existFile.userId : updateData.userId,
        tags: _.isEmpty(updateData.tags) ? existFile.tags : updateData.tags,
        views: _.isEmpty(updateData.views) ? existFile.views : updateData.views,
      };
      const updated = await this.baseService.update(id, fileData);

      return res.json(createResponse({ data: updated, status: StatusCodes.CREATED }));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn("Error updating file", { error: error.message, loggedUser, id });
      }
      next(error);
    }
  };

  /**
   * Delete an existing entity
   * @param req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   * @returns JSON updated entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete = async (req: CustomRequest, res: Response, next: NextFunction): Promise<any> => {
    const { loggedUser } = req;
    const { id } = req.params;
    try {
      const existFile = await this.baseService.getById(id);
      if (!existFile) {
        throw new Error("File not found");
      }
      const fileName = existFile.path!.split("/").pop();
      await deleteFileFromDisk(fileName!);
      const deleted = await this.baseService.delete(id);

      return res.json(createResponse({ data: deleted, status: StatusCodes.CREATED }));
    } catch (error) {
      if (error instanceof Error) {
        logger.warn("Error deleting file", { error: error.message, loggedUser, id });
      }
      next(error);
    }
  };
}
