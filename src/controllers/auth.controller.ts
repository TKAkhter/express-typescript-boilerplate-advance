import { NextFunction, Response } from "express";
import { AuthDto, RegisterDto, ResetPasswordDto } from "@/schemas/auth.dto";
import { AuthService } from "@/services/auth.services";
import { logger } from "@/common/winston/winston";
import { CustomRequest } from "@/types/request";
import { StatusCodes } from "http-status-codes";
import { createResponse } from "@/utils/create-response";
import { prismaInstance } from "@/config/prisma/prisma";
import { loggedError } from "@/utils/utils";
import { COLLECTION_NAMES } from "@/constants";

const prisma = prismaInstance();

export class AuthController {
  private collectionName: string;
  private authService: AuthService;

  constructor() {
    this.collectionName = COLLECTION_NAMES.users;
    this.authService = new AuthService(prisma.users, COLLECTION_NAMES.users);
  }

  /**
   * Handles user login by verifying credentials and returning a token.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  login = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const loginDto: AuthDto = req.body;
    const { loggedUser } = req;
    logger.info(`[${this.collectionName} Controller] login API invoked`, {
      email: loginDto.email,
      loggedUser,
    });

    try {
      const data = await this.authService.login(loginDto);
      logger.info(`[${this.collectionName} Controller] User login successful`, {
        email: loginDto.email,
        loggedUser,
      });

      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] login API error`, {
        email: loginDto.email,
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Handles user registration by creating a new user and returning the registered user details.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  register = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const registerDto: RegisterDto = req.body;
    const { loggedUser } = req;
    logger.info(`[${this.collectionName} Controller] Register API invoked`, {
      email: registerDto.email,
      loggedUser,
    });

    try {
      const data = await this.authService.register(registerDto);
      logger.info(`[${this.collectionName} Controller] User registration successful`, {
        email: registerDto.email,
        loggedUser,
      });

      res.json(createResponse({ data, status: StatusCodes.CREATED }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] Register API error`, {
        email: registerDto.email,
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Handles user logout by invalidating the user's token.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  logout = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    const { loggedUser } = req;
    logger.info(`[${this.collectionName} Controller] Logout API invoked`, { token, loggedUser });

    try {
      const data = await this.authService.logout(token!);
      logger.info(`[${this.collectionName} Controller] User logout successful`, {
        token,
        loggedUser,
      });

      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] Logout API error`, {
        token,
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Extends the user's token and returns a new token.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  extendToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { loggedUser } = req;
    const { token } = req.body;
    logger.info(`[${this.collectionName} Controller] ExtendToken API invoked`, {
      token,
      loggedUser,
    });

    try {
      const data = await this.authService.extendToken(token!);
      logger.info(`[${this.collectionName} Controller] Token extended successfully`, {
        data,
        loggedUser,
      });
      res.json(createResponse({ data, status: StatusCodes.CREATED }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] ExtendToken API error`, {
        token,
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Initiates the forgot password process for a user.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  forgotPassword = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { loggedUser } = req;
    logger.info(`[${this.collectionName} Controller] Forgot password API invoked`, {
      email,
      loggedUser,
    });

    try {
      const data = await this.authService.forgotPassword(email);
      logger.info(`[${this.collectionName} Controller] Forgot password successful`, {
        email,
        loggedUser,
      });
      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] Forgot password API error`, {
        email,
        loggedUser,
      });
      next(error);
    }
  };

  /**
   * Initiates the reset password process for a user.
   * @param _req - CustomRequest object
   * @param res - Response object
   * @param next - Next middleware function
   */
  resetPassword = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { resetToken, password, confirmPassword } = req.body;
    const { loggedUser } = req;
    logger.info(`[${this.collectionName} Controller] Reset password API invoked`, {
      resetToken,
      loggedUser,
    });

    const resetPasswordDto: ResetPasswordDto = {
      password,
      confirmPassword,
      resetToken,
    };
    try {
      const data = await this.authService.resetPassword(resetPasswordDto);
      logger.info(`[${this.collectionName} Controller] Reset password successful`, {
        resetToken,
        loggedUser,
      });
      res.json(createResponse({ data }));
    } catch (error) {
      loggedError(error, `[${this.collectionName} Controller] Reset password API error`, {
        resetToken,
        loggedUser,
      });
      next(error);
    }
  };
}
