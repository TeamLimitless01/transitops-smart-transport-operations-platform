import { prisma } from "@/lib/prisma";
import { Prisma, VehicleStatus } from "@/app/generated/prisma";
import { VehicleInput } from "../schemas/vehicle.schema";

export async function getVehicles(
  search?: string,
  status?: VehicleStatus
) {
  const where: Prisma.VehicleWhereInput = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        registrationNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  return prisma.vehicle.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: {
      id,
    },
  });
}

export async function createVehicle(data: VehicleInput) {
  return prisma.vehicle.create({
    data,
  });
}

export async function updateVehicle(
  id: string,
  data: Partial<VehicleInput>
) {
  return prisma.vehicle.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteVehicle(id: string) {
  return prisma.vehicle.delete({
    where: {
      id,
    },
  });
}