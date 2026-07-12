import { NextRequest, NextResponse } from "next/server";
import { VehicleStatus } from "@/app/generated/prisma";
import { vehicleSchema } from "@/app/schemas/vehicle.schema";
import { createVehicle, getVehicles } from "@/app/services/vehicle.service";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";

    const status =
      (searchParams.get("status") as VehicleStatus | null) ??
      undefined;

    const vehicles = await getVehicles(search, status);

    return NextResponse.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch vehicles.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedData = vehicleSchema.parse(body);

    const vehicle = await createVehicle(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: vehicle,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 400,
      }
    );
  }
}