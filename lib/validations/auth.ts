import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]),
  licenseNumber: z.string().optional(),
  licenseCategory: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "DRIVER") {
    if (!data.licenseNumber || data.licenseNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License number is required for drivers",
        path: ["licenseNumber"],
      });
    }
    if (!data.licenseCategory || data.licenseCategory.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License category is required for drivers",
        path: ["licenseCategory"],
      });
    }
    if (!data.licenseExpiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License expiry date is required for drivers",
        path: ["licenseExpiryDate"],
      });
    }
  }
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
