import { UserSchema } from "@/generated/zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const updateUserSchema = UserSchema.omit({
  id: true,
  password: true,
  createdAt: true,
}).partial();

export type UserDto = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
