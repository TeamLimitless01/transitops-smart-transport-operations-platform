import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId, type, amount, description, liters, date } = body;

    if (!tripId || !type || amount === undefined || !date) {
      return NextResponse.json({ error: "tripId, type, amount, and date are required" }, { status: 422 });
    }

    // Fetch the trip to get vehicleId and verify driver access
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Drivers can only log expenses on their own trips
    if (session.user.role === "DRIVER") {
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
      });
      if (!driver || driver.id !== trip.driverId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        tripId,
        vehicleId: trip.vehicleId,
        type,
        amount: parseFloat(amount),
        description: description || null,
        liters: liters ? parseFloat(liters) : 0,
        cost: parseFloat(amount),
        date: new Date(date),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("[CREATE EXPENSE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
