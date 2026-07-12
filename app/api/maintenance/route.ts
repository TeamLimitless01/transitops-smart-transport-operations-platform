import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const records = await prisma.maintenance.findMany({
      include: {
        vehicle: {
          select: { id: true, name: true, registrationNumber: true, type: true, model: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[GET MAINTENANCE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["FLEET_MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { vehicleId, description, cost, startDate } = body;

    if (!vehicleId || !description) {
      return NextResponse.json({ error: "vehicleId and description are required" }, { status: 422 });
    }

    // Check vehicle exists and is not already in maintenance or on a trip
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    if (vehicle.status === "ON_TRIP") {
      return NextResponse.json({ error: "Cannot put vehicle on maintenance while it is on a trip" }, { status: 409 });
    }

    const record = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.maintenance.create({
        data: {
          vehicleId,
          description,
          cost: cost ? parseFloat(cost) : 0,
          startDate: startDate ? new Date(startDate) : new Date(),
          status: "ACTIVE",
        },
        include: {
          vehicle: {
            select: { id: true, name: true, registrationNumber: true, type: true, model: true },
          },
        },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: "IN_SHOP" },
      });

      return maintenance;
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[CREATE MAINTENANCE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
