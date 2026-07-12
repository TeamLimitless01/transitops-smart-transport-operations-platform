import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // e.g. ?type=FUEL or ?type=OTHER

    const expenses = await prisma.expense.findMany({
      where: type ? { type: type as any } : undefined,
      include: {
        vehicle: { select: { id: true, name: true, registrationNumber: true } },
        trip: { select: { id: true, source: true, destination: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[GET EXPENSES ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { createExpenseSchema } from "@/lib/validations/expense";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const result = createExpenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { tripId, type, amount, description, liters, date } = result.data;

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
        amount,
        description: description || null,
        liters: liters || 0,
        cost: amount,
        date: new Date(date),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("[CREATE EXPENSE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
