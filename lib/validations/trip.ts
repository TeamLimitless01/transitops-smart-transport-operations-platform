import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().min(1, "Origin/Source is required").max(100),
  destination: z.string().min(1, "Destination is required").max(100),
  cargoWeight: z.coerce
    .number({ message: "Weight must be a number" })
    .positive("Cargo weight must be a positive number"),
  plannedDistance: z.coerce
    .number({ message: "Distance must be a number" })
    .positive("Planned distance must be a positive number"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
});

export const updateTripSchema = z.object({
  status: z.enum(["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"]).optional(),
  actualDistance: z.coerce
    .number({ message: "Distance must be a number" })
    .positive("Actual distance must be a positive number")
    .optional(),
  fuelConsumed: z.coerce
    .number({ message: "Fuel consumed must be a number" })
    .nonnegative("Fuel consumed cannot be negative")
    .optional(),
});
