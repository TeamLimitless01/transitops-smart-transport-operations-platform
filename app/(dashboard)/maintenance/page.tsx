import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MaintenanceManager from "@/components/maintenance/MaintenanceManager";

export default async function MaintenancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowedRoles = ["FLEET_MANAGER", "ADMIN", "FINANCIAL_ANALYST"];
  if (!allowedRoles.includes(session.user.role)) redirect("/dashboard");

  const [records, vehicles] = await Promise.all([
    prisma.maintenance.findMany({
      include: {
        vehicle: {
          select: { id: true, name: true, registrationNumber: true, type: true, model: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({
      select: { id: true, name: true, registrationNumber: true, type: true, model: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Vehicle Maintenance</h1>
        <p className="text-sm text-slate-400 mt-1">
          Schedule and track vehicle maintenance. Vehicles in maintenance are automatically marked unavailable.
        </p>
      </div>
      <MaintenanceManager
        initialRecords={JSON.parse(JSON.stringify(records))}
        vehicles={JSON.parse(JSON.stringify(vehicles))}
      />
    </div>
  );
}