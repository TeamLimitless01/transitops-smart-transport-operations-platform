import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

import { updateTripSchema } from "@/lib/validations/trip";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateTripSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { status, actualDistance, fuelConsumed } = result.data;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Drivers can only update their own trips
    if (session.user.role === "DRIVER") {
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
      });
      if (!driver || driver.id !== trip.driverId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(actualDistance !== undefined && { actualDistance }),
          ...(fuelConsumed !== undefined && { fuelConsumed }),
          ...(status === "COMPLETED" && { endTime: new Date() }),
        },
        include: {
          vehicle: {
            select: { id: true, name: true, registrationNumber: true, type: true },
          },
          driver: {
            select: { id: true, name: true, licenseNumber: true },
          },
          expenses: true,
        },
      });

      // If trip completed/cancelled, free up vehicle and driver
      if (status === "COMPLETED" || status === "CANCELLED") {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "AVAILABLE" },
        });
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: "AVAILABLE" },
        });
      }

      return t;
    });

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error("[PATCH TRIP ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
