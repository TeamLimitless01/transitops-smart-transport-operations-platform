import { z } from "zod";

export const createExpenseSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  type: z.enum(["FUEL", "MAINTENANCE", "TOLL", "PARKING", "OTHER"], {
    message: "Please select a valid expense type",
  }),
  amount: z.coerce
    .number({ message: "Amount must be a number" })
    .positive("Amount must be a positive number"),
  description: z.string().max(250).optional(),
  liters: z.coerce
    .number({ message: "Liters must be a number" })
    .nonnegative("Liters cannot be negative")
    .optional(),
  date: z.coerce.date({ message: "Please enter a valid date" }),
}).superRefine((data, ctx) => {
  if (data.type === "FUEL" && (!data.liters || data.liters <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Liters consumed is required for fuel expenses",
      path: ["liters"],
    });
  }
});
