import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import VehicleTable from "@/components/vehicles/VehicleTable";

// Revalidate occasionally or dynamically
export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!hasAccess(session.user.role, "Vehicles")) {
    redirect("/dashboard");
  }
  // Fetch vehicles initially on the server side
  const vehicles = await prisma.vehicle.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Convert dates to string for serialization
  const serializedVehicles = vehicles.map(v => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your fleet vehicles.
          </p>
        </div>
      </div>

      {/* Replaces the static VehicleTable from before */}
      <VehicleTable initialVehicles={serializedVehicles} />
    </div>
  );
}