import { z } from "zod";

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, "Registration number is required"),

  name: z
    .string()
    .min(1, "Vehicle name is required"),

  model: z
    .string()
    .min(1, "Vehicle model is required"),

  type: z.enum([
    "TRUCK",
    "VAN",
    "BUS",
    "PICKUP",
    "CAR",
    "OTHER",
  ]),

  maxLoadCapacity: z.coerce.number().positive(),

  odometer: z.coerce.number().min(0),

  acquisitionCost: z.coerce.number().min(0),

  region: z.string().optional(),

  status: z
    .enum([
      "AVAILABLE",
      "ON_TRIP",
      "IN_SHOP",
      "RETIRED",
    ])
    .optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;