import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DriverDashboard from "@/components/driver/DriverDashboard";
import { ArrowRight, Users, Truck, UserCircle, Map, ChevronRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // ── Driver View ──────────────────────────────────────────────────────────────
  if (session.user.role === "DRIVER") {
    // Find the driver record linked to this user
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
  const [userCount, vehicleCount, driverCount, tripCount, activeTrips] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.driver.count(),
    prisma.trip.count(),
    prisma.trip.findMany({
      where: { status: "DISPATCHED" },
      include: {
        vehicle: { select: { name: true, registrationNumber: true } },
        driver: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    {
      title: "Registered Users",
      value: userCount,
      desc: "Administrators & staff",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      icon: Users,
      link: "/dashboard/users",
    },
    {
      title: "Fleet Vehicles",
      value: vehicleCount,
      desc: "Trucks, vans & other fleet units",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      icon: Truck,
      link: "/vehicles",
    },
    {
      title: "Active Drivers",
      value: driverCount,
      desc: "Qualified personnel",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      icon: UserCircle,
      link: "/dashboard/users",
    },
    {
      title: "Trips Dispatched",
      value: tripCount,
      desc: "Active and completed trips",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      icon: Map,
      link: "/trips",
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-1.5">Operations Overview</h2>
        <p className="text-sm text-slate-400">Real-time status of your transport platform assets</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
              {/* Top Accent Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${stat.bg}`} />
              
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <Icon size={22} />
                </div>
                <span className="text-3xl font-bold text-slate-100 tracking-tight">{stat.value}</span>
              </div>
              
              <div className="flex flex-col gap-1 mt-2">
                <h3 className="text-sm font-semibold text-slate-200">{stat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{stat.desc}</p>
              </div>
              
              <Link href={stat.link} className={`mt-2 text-sm font-medium ${stat.color} inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity w-fit`}>
                Manage <ArrowRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Live Dispatches
            </h3>
            <Link href="/trips" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              View all trips &rarr;
            </Link>
          </div>
          
          <div className="flex flex-col gap-2.5">
            {activeTrips.map((trip) => (
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
                </div>
                
                <span className="text-[10px] font-bold tracking-widest bg-blue-500 text-white px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  LIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
