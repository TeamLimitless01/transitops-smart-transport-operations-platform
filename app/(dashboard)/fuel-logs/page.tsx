import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import FuelLogsManager from "@/components/expenses/FuelLogsManager";

import { hasAccess } from "@/lib/permissions";

export default async function FuelLogsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!hasAccess(session.user.role, "Fuel Logs")) {
    redirect("/dashboard");
  }

  const logs = await prisma.expense.findMany({
    where: { type: "FUEL" },
    include: {
      vehicle: { select: { id: true, name: true, registrationNumber: true } },
      trip: { select: { id: true, source: true, destination: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Fuel Logs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track all fuel fill-ups, liters consumed, and cost per liter across your fleet.
        </p>
      </div>
      <FuelLogsManager initialLogs={JSON.parse(JSON.stringify(logs))} />
    </div>
  );
}