import * as fs from "fs";
import csv from "csv-parser";
import { Readable } from "stream";
import _ from "lodash";
import { hash } from "bcryptjs";
import { env } from "@/config/env";
import { logger } from "@/common/winston/winston";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformData = async (value: string, key?: string): Promise<any> => {
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
const sanitizeEntry = ([key, value]: [string, any]): [string, any] => {
  const sanitizedKey = _.trim(_.toLower(key.replace(/\s+/g, "")));
  const sanitizedValue = _.trim(value);
  return [sanitizedKey, sanitizedValue];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const csvToJson = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];
    const stream = fs.createReadStream(filePath);

    stream
      .pipe(csv())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("data", (row: Record<string, any>) => {
        result.push(
          Object.entries(row).reduce(
            (acc, entry) => {
              const [sanitizedKey, sanitizedValue] = sanitizeEntry(entry);
              acc[sanitizedKey] = transformData(sanitizedValue, sanitizedKey); // Collect promises
              return acc;
            },
            {
              // Add default fields here
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as Record<string, any>,
          ),
        );
      })
      .on("end", async () => {
        try {
          // Wait for all promises to resolve
          const resolvedResults = await Promise.all(
            result.map(async (row) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const resolvedRow: Record<string, any> = {};
              for (const [key, value] of Object.entries(row)) {
                // eslint-disable-next-line no-await-in-loop
                resolvedRow[key] = await value;
              }
              return resolvedRow;
            }),
          );
          resolve(resolvedResults);
        } catch (err) {
          reject(err);
        } finally {
          fs.unlinkSync(filePath);
        }
      })
      .on("error", (error) => {
        reject(error);
        fs.unlinkSync(filePath);
      });
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const csvBufferToJson = (buffer: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("data", (row: Record<string, any>) => {
        result.push(
          Object.entries(row).reduce(
            (acc, entry) => {
              const [sanitizedKey, sanitizedValue] = sanitizeEntry(entry);
              acc[sanitizedKey] = transformData(sanitizedValue, sanitizedKey); // Collect promises
              return acc;
            },
            {
              // Add default fields here
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as Record<string, any>,
          ),
        );
      })
      .on("end", async () => {
        try {
          // Wait for all promises to resolve
          const resolvedResults = await Promise.all(
            result.map(async (row) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const resolvedRow: Record<string, any> = {};
              for (const [key, value] of Object.entries(row)) {
                // eslint-disable-next-line no-await-in-loop
                resolvedRow[key] = await value;
              }
              return resolvedRow;
            }),
          );
          resolve(resolvedResults);
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => reject(err));
  });
};
