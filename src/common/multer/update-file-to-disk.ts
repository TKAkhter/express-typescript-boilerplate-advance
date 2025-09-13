import fs from "fs";
import path from "path";
import { logger } from "@/common/winston/winston";
import { loggedError } from "@/utils/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateFileToDisk = async (fileName: string, file: any) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any;
    const uploadDir = "./uploads";

    const newFilePath = path.join(uploadDir, fileName);
    const tempFilePath = path.join(uploadDir, `${fileName}_temp${path.extname(file.originalname)}`);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    fs.writeFile(tempFilePath, file.buffer, (err) => {
      if (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logger.warn("Error saving file to disk:", err as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error(err as any);
      }

      response = fs.rename(tempFilePath, newFilePath, (renameErr) => {
        if (renameErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logger.warn("Error replacing file:", renameErr as any);

          return false;
        }

        logger.info(`File updated successfully: ${newFilePath}`);
        // Was removed from the response
        return { fileName, filePath: newFilePath };
      });
    });
    // Added return statement
    return response;
  } catch (error) {
    loggedError(error, "Error updating file", { fileName, file });
    throw error;
  }
};
