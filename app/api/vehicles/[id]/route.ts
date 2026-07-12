import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET ONE
export async function GET(
  req: NextRequest,
  { params }: Params
) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id,
    },
  });

  if (!vehicle) {
    return NextResponse.json(
      {
        success: false,
        message: "Vehicle not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: vehicle,
  });
}

// UPDATE
export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const vehicle = await prisma.vehicle.update({
      where: {
        id,
      },
      data: {
        registrationNumber: body.registrationNumber,
        name: body.name,
        model: body.model,
        type: body.type,
        maxLoadCapacity: Number(body.maxLoadCapacity),
        odometer: Number(body.odometer),
        acquisitionCost: Number(body.acquisitionCost),
        region: body.region,
        status: body.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update vehicle.",
      },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    await prisma.vehicle.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete vehicle.",
      },
      { status: 500 }
    );
  }
}