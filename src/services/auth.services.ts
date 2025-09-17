import { compare, hash } from "bcryptjs";
import { logger } from "@/common/winston/winston";
import { AuthDto, RegisterDto, ResetPasswordDto } from "@/schemas/auth.dto";
import { generateToken, generateResetToken, verifyToken } from "@/common/jwt/jwt";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { UsersService } from "@/services/users.service";
import { sendMail } from "@/common/mail-sender/mail-sender";
import { BaseRepository } from "@/repository/base.repository";
import { CreateUsersDto, UpdateUsersDto } from "@/schemas/users.dto";
import { env } from "@/config/env";
import { createTemplate } from "@/template/create-template";
import { Users } from "@prisma/client";
import { loggedError } from "@/utils/utils";
import { COLLECTION_NAMES } from "@/constants";

export class AuthService {
  private collectionName: string;
  private usersService: UsersService;
  private userRepository: BaseRepository<Users, UpdateUsersDto, CreateUsersDto>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, collectionName: string) {
    this.collectionName = collectionName;
    this.usersService = new UsersService(model, COLLECTION_NAMES.users);
    this.userRepository = new BaseRepository(model, COLLECTION_NAMES.users);
  }

  /**
   * Handles user login by verifying the credentials and generating a token.
   * @param authData - Object containing user login credentials.
   * @returns Object containing the generated token.
   * @throws HTTP error if user not found or password is invalid.
   */
  login = async (authData: AuthDto) => {
    logger.info(`[${this.collectionName} Service] login service invoked`, {
      email: authData.email,
    });

    try {
      const user = await this.usersService.getByEmail(authData.email);

      if (!user) {
        logger.warn(
          `[${this.collectionName} Service] ${this.collectionName} not found during login`,
          {
            email: authData.email,
          },
        );
        throw createHttpError(StatusCodes.BAD_REQUEST, `${this.collectionName} does not exist!`, {
          resource: "Auth",
        });
      }

      if (!(await compare(authData.password, user.password as string))) {
        logger.warn(`[${this.collectionName} Service] Invalid password during login`, {
          email: authData.email,
        });
        throw createHttpError(StatusCodes.BAD_REQUEST, "Invalid email or password", {
          resource: "Auth",
        });
      }

      const token = generateToken(user);

      logger.info(`[${this.collectionName} Service] Token received successfully`, {
        email: authData.email,
      });
      return { user, token };
    } catch (error) {
      loggedError(error, `[${this.collectionName} Service] login service error`, {
        email: authData.email,
      });
      throw error;
    }
  };

  /**
   * Registers a new user and generates a token for the user.
   * @param registerDto - Registration data for a new user.
   * @returns Object containing the registered user and generated token.
   * @throws HTTP error if user already exists.
   */
  register = async (registerDto: RegisterDto) => {
    logger.info(`[${this.collectionName} Service] Register service invoked`, {
      email: registerDto.email,
    });

    try {
      await this.usersService.create(registerDto);

      const login = await this.login(registerDto);

      logger.info(
        `[${this.collectionName} Service] ${this.collectionName} registered successfully`,
        {
          email: registerDto.email,
        },
      );
      return login;
    } catch (error) {
      loggedError(error, `[${this.collectionName} Service] register service error`, {
        email: registerDto.email,
      });
      throw error;
    }
  };

  /**
   * Extends the user's token and returns a new token.
   * @param token - The current token to extend.
   * @returns The newly extended token.
   * @throws Error if token extension fails.
   */
  extendToken = async (token: string) => {
    logger.info(`[${this.collectionName} Service] Extend token service invoked`, { token });

    try {
      const payload = verifyToken(token);
      const newToken = generateToken(payload);
      logger.info(`[${this.collectionName} Service] Token extended successfully`, { newToken });
      return newToken;
    } catch (error) {
      loggedError(error, `[${this.collectionName} Service] extendToken service error`, { token });
      throw error;
    }
  };

  /**
   * Logs out the user by invalidating the token.
   * @param token - The token to invalidate.
   * @returns Object with the invalidated token and success status.
   * @throws Error if logout fails.
   */
  logout = async (token: string) => {
    logger.info(`[${this.collectionName} Service] Logout service invoked`, { token });

    try {
      return { token, success: true };
    } catch (error) {
      loggedError(error, `[${this.collectionName} Service] logout service error`, { token });
      throw error;
    }
  };

  /**
   * Initiates the forgot password process for a user.
   * @param email User's email address
   * @returns message that email sent.
   * @throws HTTP error if any error occur.
   */
  forgotPassword = async (email: string) => {
    logger.info(`[${this.collectionName} Service] Forgot password service invoked`, { email });

    try {
      const user = await this.usersService.getByEmail(email);

      if (!user) {
        logger.warn(`[${this.collectionName} Service] ${this.collectionName} does not exists!`, {
          email,
        });
        throw createHttpError(StatusCodes.BAD_REQUEST, `${this.collectionName} does not exist!`, {
          resource: "Auth",
        });
      }

      const resetToken = generateResetToken(user);

      await this.usersService.update(user.id as string, {
        resetToken,
        updatedAt: new Date(),
      });

      // Send email
      try {
        const context = {
          accountName: user.name,
          URL: `${env.APP_URL}/reset-password?token=${resetToken}`,
        };

        const options = {
          from: `${env.MAILGUN_NAME} <${env.MAILGUN_SENDER_EMAIL}>`,
          to: email,
          subject: "Reset Password Requested",
          html: createTemplate("forgot-password", context),
        };

        await sendMail(options);
      } catch (error) {
        console.log(`Error: ${error}`);
        throw new Error(`Error while sending email: ${error}`);
      }

      logger.info(`[${this.collectionName} Service] Email reset link successfully sent`, {
        email,
        resetToken,
      });
      return { message: "Reset link sent. Check your inbox" };
    } catch (error) {
      loggedError(error, `[${this.collectionName} Service] forgotPassword service error`, {
        email,
      });
      throw error;
    }
  };

  resetPassword = async (resetPasswordDto: ResetPasswordDto) => {
    logger.info(`[${this.collectionName} Service] reset password service invoked`, {
      resetToken: resetPasswordDto.resetToken,
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user: any = await this.userRepository.getByField(
        "resetToken",
        resetPasswordDto.resetToken,
      );

      if (user.length === 0) {
        logger.warn(`[${this.collectionName} Service] ${this.collectionName} does not exists!`, {
          resetToken: resetPasswordDto.resetToken,
        });
        throw createHttpError(StatusCodes.BAD_REQUEST, `${this.collectionName} does not exist!`, {
          resource: "Auth",
        });
      }

      verifyToken(resetPasswordDto.resetToken);

      if (!user[0].resetToken || resetPasswordDto.resetToken !== user[0].resetToken) {
        throw createHttpError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token.");
      }

      const hashedPassword = await hash(resetPasswordDto.password, env.HASH!);

      await this.usersService.update(user[0].id, {
        password: hashedPassword,
        resetToken: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      logger.info(`[${this.collectionName} Service] Password reset successful`, {
        resetToken: resetPasswordDto.resetToken,
      });
      return { message: "Password reset successful" };
    } catch (error) {
      loggedError(error, `[${this.collectionName} Service] resetPassword service error`, {
        resetToken: resetPasswordDto.resetToken,
      });
      throw error;
    }
  };
}
