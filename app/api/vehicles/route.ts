import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vehicles
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const vehicles = await prisma.vehicle.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
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
                ],
              }
            : {},
          status
            ? {
                status: status as any,
              }
            : {},
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vehicles.",
      },
      { status: 500 }
    );
  }
}

// POST /api/vehicles
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: body.registrationNumber,
        name: body.name,
        model: body.model,
        type: body.type,
        maxLoadCapacity: Number(body.maxLoadCapacity),
        odometer: Number(body.odometer),
        acquisitionCost: Number(body.acquisitionCost),
        region: body.region,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: vehicle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create vehicle.",
      },
      { status: 500 }
    );
  }
}