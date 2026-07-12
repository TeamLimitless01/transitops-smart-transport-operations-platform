import { z } from "zod";

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle selection is required"),
  description: z.string().min(1, "Description is required").max(500),
  cost: z.coerce
    .number({ message: "Cost must be a number" })
    .nonnegative("Cost cannot be negative")
    .optional(),
  startDate: z.coerce.date({ message: "Please enter a valid start date" }).optional(),
});
