import { vehicleSchema } from "@/app/schemas/vehicle.schema";
import { deleteVehicle, getVehicleById, updateVehicle } from "@/app/services/vehicle.service";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    const vehicle = await getVehicleById(id);

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const validatedData = vehicleSchema.parse(body);

    const vehicle = await updateVehicle(id, validatedData);

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
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

export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    await deleteVehicle(id);

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
      {
        status: 500,
      }
    );
  }
}