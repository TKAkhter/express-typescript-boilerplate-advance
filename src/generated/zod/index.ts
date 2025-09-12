import { z } from "zod";
import { Prisma } from "@prisma/client";

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput =
  | Prisma.JsonValue
  | null
  | "JsonNull"
  | "DbNull"
  | Prisma.NullTypes.DbNull
  | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === "DbNull") {
    return Prisma.DbNull;
  }
  if (v === "JsonNull") {
    return Prisma.JsonNull;
  }
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ]),
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal("DbNull"), z.literal("JsonNull")])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ]),
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const UsersScalarFieldEnumSchema = z.enum([
  "id",
  "email",
  "password",
  "roleId",
  "tenantId",
  "name",
  "phoneNumber",
  "bio",
  "resetToken",
  "deletedAt",
  "createdAt",
  "updatedAt",
]);

export const TenantsScalarFieldEnumSchema = z.enum(["id", "name", "createdAt", "updatedAt"]);

export const RolesScalarFieldEnumSchema = z.enum(["id", "name", "createdAt", "updatedAt"]);

export const FilesScalarFieldEnumSchema = z.enum([
  "id",
  "userId",
  "name",
  "path",
  "text",
  "tags",
  "views",
  "createdAt",
  "updatedAt",
]);

export const ErrorLogsScalarFieldEnumSchema = z.enum([
  "id",
  "status",
  "message",
  "method",
  "url",
  "loggedUser",
  "name",
  "stack",
  "details",
  "createdAt",
  "updatedAt",
]);

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const QueryModeSchema = z.enum(["default", "insensitive"]);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USERS SCHEMA
/////////////////////////////////////////

export const UsersSchema = z.object({
  id: z.string(),
  email: z.string(),
  password: z.string(),
  roleId: z.string(),
  tenantId: z.string(),
  name: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  bio: z.string().nullable(),
  resetToken: z.string().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Users = z.infer<typeof UsersSchema>;

/////////////////////////////////////////
// TENANTS SCHEMA
/////////////////////////////////////////

export const TenantsSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tenants = z.infer<typeof TenantsSchema>;

/////////////////////////////////////////
// ROLES SCHEMA
/////////////////////////////////////////

export const RolesSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Roles = z.infer<typeof RolesSchema>;

/////////////////////////////////////////
// FILES SCHEMA
/////////////////////////////////////////

export const FilesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  path: z.string().nullable(),
  text: z.string().nullable(),
  tags: z.string().nullable(),
  views: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Files = z.infer<typeof FilesSchema>;

/////////////////////////////////////////
// ERROR LOGS SCHEMA
/////////////////////////////////////////

export const ErrorLogsSchema = z.object({
  id: z.string(),
  status: z.string().nullable(),
  message: z.string().nullable(),
  method: z.string().nullable(),
  url: z.string().nullable(),
  loggedUser: z.string().nullable(),
  name: z.string().nullable(),
  stack: z.string().nullable(),
  details: JsonValueSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ErrorLogs = z.infer<typeof ErrorLogsSchema>;
