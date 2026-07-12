import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    const trips = await prisma.trip.findMany({
      where: driverId ? { driverId } : undefined,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
            type: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            licenseNumber: true,
          },
        },
        expenses: {
          select: {
            id: true,
            type: true,
            amount: true,
            liters: true,
            cost: true,
            date: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("[GET TRIPS ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.user.role !== "FLEET_MANAGER") {
      return NextResponse.json({ error: "Access denied — Fleet Managers only" }, { status: 403 });
    }

    const body = await req.json();
    const { source, destination, cargoWeight, plannedDistance, vehicleId, driverId } = body;

    if (!source || !destination || !cargoWeight || !plannedDistance || !vehicleId || !driverId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 422 });
    }

    // Ensure the vehicle & driver are available
    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
    ]);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    if (vehicle.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Vehicle is not available" }, { status: 409 });
    }
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }
    if (driver.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Driver is not available" }, { status: 409 });
    }

    // Create trip & update vehicle/driver status atomically
    const [trip] = await prisma.$transaction([
      prisma.trip.create({
        data: {
          source,
          destination,
          cargoWeight: parseFloat(cargoWeight),
          plannedDistance: parseFloat(plannedDistance),
          vehicleId,
          driverId,
          status: "DISPATCHED",
          startTime: new Date(),
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
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "ON_TRIP" },
      }),
      prisma.driver.update({
        where: { id: driverId },
        data: { status: "ON_TRIP" },
      }),
    ]);

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("[CREATE TRIP ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
