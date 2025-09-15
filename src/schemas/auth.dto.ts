import { UsersSchema } from "@/generated/zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const passwordSchema = z
  .string()
  .min(8)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .superRefine((value: string, context: any) => {
    if (value === value.toLowerCase()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing a capital letter",
      });
    }

    if (value === value.toUpperCase()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing a lowercase letter",
      });
    }

    if (!/\d/.test(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing a number",
      });
    }

    // eslint-disable-next-line no-useless-escape
    if (!/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~\-]/.test(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing a special character",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export const authResponseSchema = z.object({
  user: UsersSchema,
  token: z.string(),
});

export const logoutSchema = z.object({
  success: z.boolean(),
});

export const extendTokenSchema = z.object({
  token: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().trim(),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string(),
    password: passwordSchema,
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const registerSchema = z
  .object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterDto = z.infer<typeof registerSchema>;
export type AuthDto = z.infer<typeof loginSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
