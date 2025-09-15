import { env } from "@/config/env";
import { hash } from "bcryptjs";
import { logger } from "@/common/winston/winston";
import _ from "lodash";

export const generatePassword = (): string => {
  const getRandomChar = (characters: string): string =>
    characters[Math.floor(Math.random() * characters.length)];

  const categories = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ", // Uppercase letters
    "abcdefghijklmnopqrstuvwxyz", // Lowercase letters
    "0123456789", // Digits
    "!@#$%^&*()_-+=<>?/", // Special characters
  ];

  const password = categories.map(getRandomChar).join("");

  const remainingLength = env.GENERATED_PASSWORD_LENGTH - password.length;
  const allCharacters = categories.join("");
  const randomChars = Array.from({ length: remainingLength }, () => getRandomChar(allCharacters));

  console.log(`Generated Password ==> ${password + randomChars.join("")}`);
  return password + randomChars.join("");
};

export const extractDomainFromEmailAddress = (email: string): string | null => {
  const match = email.match(/@([\w.-]+)/);
  if (!match) {
    return null;
  }

  return match[1].toLowerCase();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const transformData = async (value: string, key?: string): Promise<any> => {
  if (key?.toLowerCase() === "password") {
    try {
      return await hash(value, env.HASH!);
    } catch (error) {
      logger.info(`Error hashing password: ${error}`);
      throw new Error(`Error hashing password: ${error}`);
    }
  }
  if (value === "NULL") {
    return null;
  }
  if (value === "FALSE") {
    return false;
  }
  if (value === "TRUE") {
    return true;
  }
  if (value === "UNDEFINED") {
    return undefined;
  }
  return value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeEntry = ([key, value]: [string, any]): [string, any] => {
  const sanitizedKey = _.trim(_.toLower(key.replace(/\s+/g, "")));
  const sanitizedValue = _.trim(value);
  return [sanitizedKey, sanitizedValue];
};

export const loggedError = (error: unknown, message: string, args?: Record<string, unknown>) => {
  if (error instanceof Error) {
    logger.warn(message, {
      ...args,
      error: error.message,
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findDeep = (obj: any, keys: string[]): any => {
  if (!obj || typeof obj !== "object") {
    return null;
  }
  for (const key of keys) {
    if (key in obj) {
      return obj[key];
    }
  }
  for (const value of Object.values(obj)) {
    const found = findDeep(value, keys);
    if (found) {
      return found;
    }
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cleanObject = (obj: any): any => {
  if (_.isArray(obj)) {
    return obj.map(cleanObject).filter((v) => !_.isNil(v) && (!_.isObject(v) || !_.isEmpty(v)));
  }

  if (_.isPlainObject(obj)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = _.mapValues(obj, cleanObject) as Record<string, any>;
    // eslint-disable-next-line no-mixed-operators
    return _.omitBy(mapped, (v) => _.isNil(v) || (_.isObject(v) && _.isEmpty(v)));
  }

  return obj;
};
