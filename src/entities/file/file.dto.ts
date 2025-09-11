import { FileSchema } from "@/generated/zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const fileUploadSchema = {
  file: z
    .any()
    .openapi({
      type: "string",
      format: "binary",
    })
    .describe("The file to upload")
    .optional(),
  views: z
    .string()
    .refine((data) => !Number.isNaN(Number(data)), "ID must be a numeric value")
    .transform(Number)
    .refine((num) => num > 0, "ID must be a positive number"),
};

export const uploadFileSchema = FileSchema.omit({
  id: true,
  path: true,
  text: true,
  views: true,
  createdAt: true,
  updatedAt: true,
})
  .extend(fileUploadSchema)
  .partial();

export const updateFileSchema = FileSchema.omit({
  id: true,
  path: true,
  text: true,
  views: true,
  createdAt: true,
  updatedAt: true,
})
  .extend(fileUploadSchema)
  .partial();

export type UploadFileDto = z.infer<typeof uploadFileSchema>;
export type UpdateFileDto = z.infer<typeof updateFileSchema>;
