import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TripsManager from "@/components/trips/TripsManager";

export default async function TripsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [trips, vehicles, drivers] = await Promise.all([
    prisma.trip.findMany({
      include: {
        vehicle: { select: { id: true, name: true, registrationNumber: true, type: true } },
        driver: { select: { id: true, name: true, licenseNumber: true } },
        expenses: { select: { id: true, type: true, amount: true, liters: true, cost: true, date: true, description: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({
      select: { id: true, name: true, registrationNumber: true, type: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.driver.findMany({
      select: { id: true, name: true, licenseNumber: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
          Trip Dispatch
        </h1>
        <p style={{ fontSize: "14px", color: "#475569", margin: "6px 0 0" }}>
          Create and monitor all fleet trips. Only available vehicles and drivers can be assigned.
        </p>
      </div>

      <TripsManager
        initialTrips={JSON.parse(JSON.stringify(trips))}
        vehicles={JSON.parse(JSON.stringify(vehicles))}
        drivers={JSON.parse(JSON.stringify(drivers))}
      />
    </div>
  );
}
