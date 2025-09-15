import { UsersSchema } from "@/generated/zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createUsersSchema = UsersSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const updateUsersSchema = UsersSchema.omit({
  id: true,
  password: true,
  createdAt: true,
}).partial();

export type UserDto = z.infer<typeof UsersSchema>;
export type CreateUsersDto = z.infer<typeof createUsersSchema>;
export type UpdateUsersDto = z.infer<typeof updateUsersSchema>;
