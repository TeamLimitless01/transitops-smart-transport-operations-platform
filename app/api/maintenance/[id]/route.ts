import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["FLEET_MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, cost, endDate } = body;

    const maintenance = await prisma.maintenance.findUnique({ where: { id } });
    if (!maintenance) return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.maintenance.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(cost !== undefined && { cost: parseFloat(cost) }),
          ...(status === "COMPLETED" && { endDate: endDate ? new Date(endDate) : new Date() }),
        },
        include: {
          vehicle: {
            select: { id: true, name: true, registrationNumber: true, type: true, model: true },
          },
        },
      });

      // Free up the vehicle when maintenance completes
      if (status === "COMPLETED") {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: { status: "AVAILABLE" },
        });
      }

      return record;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH MAINTENANCE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
