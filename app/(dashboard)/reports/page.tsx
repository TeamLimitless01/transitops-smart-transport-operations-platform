import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  BarChart3, TrendingUp, Truck, Map, Wrench, Droplets, Wallet, Users, Compass, Percent
} from "lucide-react";

import { hasAccess } from "@/lib/permissions";
import { getSystemSettings } from "@/lib/settings";
import ReportsExport from "@/components/reports/ReportsExport";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!hasAccess(session.user.role, "Reports")) {
    redirect("/dashboard");
  }

  const settings = getSystemSettings();

  const [trips, expenses, maintenance, vehicles, drivers] = await Promise.all([
    prisma.trip.findMany({
      include: {
        expenses: true,
        driver: { select: { name: true } },
        vehicle: { select: { name: true, registrationNumber: true } },
      },
    }),
    prisma.expense.findMany(),
    prisma.maintenance.findMany(),
    prisma.vehicle.findMany(),
    prisma.driver.findMany(),
  ]);

  // Format helper functions for server component
  const convertDistance = (km: number) => {
    const val = settings.distanceUnit === "miles" ? km * 0.621371 : km;
    return val;
  };

  const formatCost = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Calculate stats
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");
  const activeTrips = trips.filter((t) => t.status === "DISPATCHED");
  const totalExpenses = expenses.reduce((s, e) => s + e.cost, 0);
  const fuelExpenses = expenses.filter((e) => e.type === "FUEL");
  const totalFuelCost = fuelExpenses.reduce((s, e) => s + e.cost, 0);
  const totalFuelLiters = fuelExpenses.reduce((s, e) => s + e.liters, 0);
  const activeMaintenance = maintenance.filter((m) => m.status === "ACTIVE");
  const totalMaintenanceCost = maintenance.reduce((s, m) => s + m.cost, 0);
  
  // New KPIs
  const totalOperationalCost = totalFuelCost + totalMaintenanceCost;
  
  // Fuel Efficiency (Distance / Fuel)
  const totalActualDistance = completedTrips.reduce((s, t) => s + (t.actualDistance || 0), 0);
  const totalFuelConsumed = completedTrips.reduce((s, t) => s + (t.fuelConsumed || 0), 0);
  const avgFuelEfficiency = totalFuelConsumed > 0 
    ? convertDistance(totalActualDistance) / totalFuelConsumed 
    : 0;

  // Fleet Utilization (%)
  const onTripVehicles = vehicles.filter(v => v.status === "ON_TRIP").length;
  const fleetUtilization = vehicles.length > 0 ? (onTripVehicles / vehicles.length) * 100 : 0;

  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const availableDrivers = drivers.filter((d) => d.status === "AVAILABLE");

  // Per-trip expense totals for top-cost trips
  const tripsWithCost = trips
    .map((t) => ({ ...t, totalCost: t.expenses.reduce((s, e) => s + e.cost, 0) }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);

  // Expense breakdown by type
  const expenseByType = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + e.cost;
    return acc;
  }, {});

  const typeColors: Record<string, string> = {
    FUEL: "bg-emerald-500",
    MAINTENANCE: "bg-amber-500",
    TOLL: "bg-blue-500",
    PARKING: "bg-purple-500",
    OTHER: "bg-slate-500",
  };

  // Vehicles with ROI and operational metrics
  const vehiclesWithROI = vehicles.map(v => {
    const vFuel = expenses.filter(e => e.vehicleId === v.id && e.type === "FUEL").reduce((s, e) => s + e.cost, 0);
    const vMaint = maintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    const vTolls = expenses.filter(e => e.vehicleId === v.id && e.type === "TOLL").reduce((s, e) => s + e.cost, 0);
    const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === "COMPLETED");
    
    // Assume revenue rate is $2.50 per km (approx $4.00 per mile)
    const vRevenue = vTrips.reduce((s, t) => s + (t.actualDistance || t.plannedDistance) * 2.50, 0);
    const vFuelCostAndMaint = vFuel + vMaint;
    
    const roi = v.acquisitionCost > 0 
      ? ((vRevenue - vFuelCostAndMaint) / v.acquisitionCost) * 100 
      : 0;

    return {
      ...v,
      fuelCost: vFuel,
      maintenanceCost: vMaint,
      operationalCost: vFuelCostAndMaint + vTolls,
      revenue: vRevenue,
      roi,
    };
  }).sort((a, b) => b.roi - a.roi).slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-2 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Fleet Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of fleet performance, costs, and operational metrics.
          </p>
        </div>
        <ReportsExport trips={JSON.parse(JSON.stringify(trips))} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Trips", value: trips.length, sub: `${activeTrips.length} active`, icon: Map, color: "text-indigo-400 bg-indigo-500/10", border: "border-l-indigo-500" },
          { label: "Completed Trips", value: completedTrips.length, sub: `${Math.round((completedTrips.length / Math.max(trips.length, 1)) * 100)}% completion rate`, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10", border: "border-l-emerald-500" },
          { label: "Total Expenses", value: formatCost(totalExpenses), sub: `${expenses.length} records`, icon: Wallet, color: "text-amber-400 bg-amber-500/10", border: "border-l-amber-500" },
          { label: "Fuel Cost", value: formatCost(totalFuelCost), sub: `${totalFuelLiters.toFixed(0)}L total`, icon: Droplets, color: "text-blue-400 bg-blue-500/10", border: "border-l-blue-500" },
          { label: "Maintenance Cost", value: formatCost(totalMaintenanceCost), sub: `${activeMaintenance.length} active`, icon: Wrench, color: "text-red-400 bg-red-500/10", border: "border-l-red-500" },
          { label: "Operational Cost", value: formatCost(totalOperationalCost), sub: "Fuel + Maintenance", icon: BarChart3, color: "text-orange-400 bg-orange-500/10", border: "border-l-orange-500" },
          { label: "Fuel Efficiency", value: `${avgFuelEfficiency.toFixed(2)} ${settings.distanceUnit === "miles" ? "mi/L" : "km/L"}`, sub: "Avg distance per liter", icon: Compass, color: "text-teal-400 bg-teal-500/10", border: "border-l-teal-500" },
          { label: "Fleet Utilization", value: `${fleetUtilization.toFixed(1)}%`, sub: `${onTripVehicles} units active`, icon: Percent, color: "text-pink-400 bg-pink-500/10", border: "border-l-pink-500" },
        ].map(({ label, value, sub, icon: Icon, color, border }) => (
          <div key={label} className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 ${border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
              <div className={`p-2 rounded-lg ${color.split(" ")[1]}`}>
                <Icon size={16} className={color.split(" ")[0]} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown by Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">Expense Breakdown by Category</h2>
          <div className="flex flex-col gap-4">
            {Object.entries(expenseByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, cost]) => {
                const pct = totalExpenses > 0 ? (cost / totalExpenses) * 100 : 0;
                return (
                  <div key={type} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-slate-200">{formatCost(cost)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${typeColors[type] || "bg-slate-500"} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(expenseByType).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">No expense data yet.</p>
            )}
          </div>
        </div>

        {/* Top 5 Most Expensive Trips */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">Top 5 Costliest Trips</h2>
          <div className="flex flex-col gap-3">
            {tripsWithCost.length > 0 ? (
              tripsWithCost.map((trip, idx) => (
                <div key={trip.id} className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: idx === 0 ? "rgba(251,191,36,0.2)" : "rgba(100,116,139,0.1)", color: idx === 0 ? "#fbbf24" : "#94a3b8" }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{trip.source} → {trip.destination}</p>
                    <p className="text-xs text-slate-500">{trip.driver?.name || "—"} · {new Date(trip.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-200 shrink-0">{formatCost(trip.totalCost)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No trip data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle ROI Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">Top 5 Vehicles ROI & Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30">
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Vehicle</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">Revenue</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">Fuel Cost</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">Maint. Cost</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">Acquisition</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {vehiclesWithROI.length > 0 ? (
                vehiclesWithROI.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200">{v.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{v.registrationNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">{formatCost(v.revenue)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">{formatCost(v.fuelCost)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">{formatCost(v.maintenanceCost)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">{formatCost(v.acquisitionCost)}</td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${v.roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {v.roi.toFixed(1)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-6 text-sm">No vehicle ROI data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet Status Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">Fleet Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const).map((status) => {
            const count = vehicles.filter((v) => v.status === status).length;
            const pct = vehicles.length > 0 ? (count / vehicles.length) * 100 : 0;
            const colors: Record<string, string> = {
              AVAILABLE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              ON_TRIP: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              IN_SHOP: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              RETIRED: "text-red-400 bg-red-500/10 border-red-500/20",
            };
            return (
              <div key={status} className={`rounded-2xl p-4 border ${colors[status]}`}>
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{status.replace("_", " ")}</p>
                <p className="text-xs mt-2 opacity-60">{pct.toFixed(0)}% of fleet</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}