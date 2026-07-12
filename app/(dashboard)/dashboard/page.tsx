import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DriverDashboard from "@/components/driver/DriverDashboard";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import {
  ArrowRight, Users, Truck, UserCircle, Map, Compass, Percent, Wrench
} from "lucide-react";

interface DashboardPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    region?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  // ── Driver View ──────────────────────────────────────────────────────────────
  if (session.user.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: {
        trips: {
          include: {
            vehicle: { select: { id: true, name: true, registrationNumber: true, type: true } },
            driver: { select: { id: true, name: true, licenseNumber: true } },
            expenses: { select: { id: true, type: true, amount: true, liters: true, cost: true, date: true, description: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!driver) {
      return (
        <div className="p-10 text-red-400 bg-red-950/20 border border-red-900/50 rounded-xl">
          No driver profile found for your account. Please contact your Fleet Manager.
        </div>
      );
    }

    return (
      <DriverDashboard
        driverName={driver.name}
        trips={JSON.parse(JSON.stringify(driver.trips))}
      />
    );
  }

  // ── Fleet Manager / Other Roles View ─────────────────────────────────────────
  const filters = await searchParams;
  const { type, status, region } = filters;

  // Filter vehicles query
  const vehicleWhere: any = {};
  if (type && type !== "ALL") vehicleWhere.type = type;
  if (status && status !== "ALL") vehicleWhere.status = status;
  if (region) {
    vehicleWhere.region = {
      contains: region,
      mode: "insensitive",
    };
  }

  const [vehicles, allTrips, driversCount, driversOnDuty] = await Promise.all([
    prisma.vehicle.findMany({
      where: vehicleWhere,
    }),
    prisma.trip.findMany({
      include: {
        vehicle: { select: { name: true, registrationNumber: true, type: true, region: true } },
        driver: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.driver.count(),
    prisma.driver.count({
      where: {
        status: { in: ["AVAILABLE", "ON_TRIP"] },
      },
    }),
  ]);

  // Filters are applied to vehicles. Trips are filtered by vehicle specifications.
  const filteredVehicleIds = new Set(vehicles.map(v => v.id));
  
  const trips = allTrips.filter((t) => {
    // If no vehicle filters are applied, show all. Otherwise, match vehicle list.
    if (Object.keys(vehicleWhere).length === 0) return true;
    return filteredVehicleIds.has(t.vehicleId);
  });

  const activeTrips = trips.filter((t) => t.status === "DISPATCHED");

  // Calculate KPIs
  const totalVehiclesCount = vehicles.length;
  const activeVehiclesCount = vehicles.filter((v) => v.status === "ON_TRIP").length;
  const availableVehiclesCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const vehiclesInMaintenanceCount = vehicles.filter((v) => v.status === "IN_SHOP").length;

  const activeTripsCount = trips.filter((t) => t.status === "DISPATCHED").length;
  const pendingTripsCount = trips.filter((t) => t.status === "DRAFT").length;
  
  const fleetUtilization = totalVehiclesCount > 0
    ? (activeVehiclesCount / totalVehiclesCount) * 100
    : 0;

  const stats = [
    {
      title: "Fleet Utilization",
      value: `${fleetUtilization.toFixed(1)}%`,
      desc: "Percentage of active vehicles",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      icon: Percent,
      link: "/reports",
    },
    {
      title: "Active Vehicles",
      value: activeVehiclesCount,
      desc: `${availableVehiclesCount} available units`,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      icon: Truck,
      link: "/vehicles",
    },
    {
      title: "Vehicles in Maintenance",
      value: vehiclesInMaintenanceCount,
      desc: "Units currently in repair shop",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      icon: Wrench,
      link: "/maintenance",
    },
    {
      title: "Active Trips",
      value: activeTripsCount,
      desc: `${pendingTripsCount} pending drafts`,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      icon: Map,
      link: "/trips",
    },
    {
      title: "Drivers On Duty",
      value: driversOnDuty,
      desc: `Out of ${driversCount} total drivers`,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      icon: UserCircle,
      link: "/dashboard/users",
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="mb-2 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-1.5">Operations Overview</h2>
          <p className="text-sm text-slate-400">Real-time status of your transport platform assets</p>
        </div>
      </div>

      {/* URL Filters */}
      <DashboardFilters />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className={`absolute top-0 left-0 right-0 h-1 ${stat.bg}`} />
              
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-2xl font-bold text-slate-100 tracking-tight">{stat.value}</span>
              </div>
              
              <div className="flex flex-col gap-1 mt-2">
                <h3 className="text-xs font-semibold text-slate-200">{stat.title}</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed truncate">{stat.desc}</p>
              </div>
              
              <Link href={stat.link} className={`mt-2 text-xs font-semibold ${stat.color} inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity w-fit`}>
                Manage <ArrowRight size={12} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Active Trips / Live Dispatches */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Live Dispatches ({activeTrips.length})
          </h3>
          <Link href="/trips" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            View all trips &rarr;
          </Link>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {activeTrips.slice(0, 5).map((trip) => (
            <div key={trip.id} className="flex items-center justify-between gap-4 bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-200">{trip.source}</span>
                <ArrowRight size={14} className="text-slate-500" />
                <span className="text-sm font-bold text-slate-200">{trip.destination}</span>
              </div>
              
              <div className="flex gap-2 text-xs text-slate-400 flex-1 px-4 hidden sm:flex">
                <span>{trip.driver.name}</span>
                <span className="text-slate-700">&bull;</span>
                <span>{trip.vehicle.name} ({trip.vehicle.registrationNumber})</span>
                {trip.vehicle.region && (
                  <>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-slate-500">{trip.vehicle.region}</span>
                  </>
                )}
              </div>
              
              <span className="text-[10px] font-bold tracking-widest bg-blue-500 text-white px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                LIVE
              </span>
            </div>
          ))}
          {activeTrips.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">No live dispatches matching current filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
