import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DriverDashboard from "@/components/driver/DriverDashboard";

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
        <div style={{ padding: 40, color: "#ef4444" }}>
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
      color: "#6366f1",
      icon: "👥",
      link: "/dashboard/users",
    },
    {
      title: "Fleet Vehicles",
      value: vehicleCount,
      desc: "Trucks, vans & other fleet units",
      color: "#10b981",
      icon: "🚛",
      link: "/vehicles",
    },
    {
      title: "Active Drivers",
      value: driverCount,
      desc: "Qualified personnel",
      color: "#f59e0b",
      icon: "🧑‍✈️",
      link: "/dashboard/users",
    },
    {
      title: "Trips Dispatched",
      value: tripCount,
      desc: "Active and completed trips",
      color: "#3b82f6",
      icon: "🛣️",
      link: "/trips",
    },
  ];

  return (
    <div className="overview-root">
      <div className="overview-header">
        <h2 className="overview-title">Operations Overview</h2>
        <p className="overview-subtitle">Real-time status of your transport platform assets</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.title} className="stat-card" style={{ "--accent-color": stat.color } as React.CSSProperties}>
            <div className="stat-card-header">
              <div className="stat-icon">{stat.icon}</div>
              <span className="stat-value">{stat.value}</span>
            </div>
            <div className="stat-card-body">
              <h3 className="stat-card-title">{stat.title}</h3>
              <p className="stat-card-desc">{stat.desc}</p>
            </div>
            <Link href={stat.link} className="stat-card-action">
              Manage
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <div className="active-trips-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="live-dot" />
              Live Dispatches
            </h3>
            <Link href="/trips" className="view-all-link">View all trips →</Link>
          </div>
          <div className="active-trips-list">
            {activeTrips.map((trip) => (
              <div key={trip.id} className="active-trip-row">
                <div className="atr-route">
                  <span className="atr-source">{trip.source}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="atr-arrow">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="atr-dest">{trip.destination}</span>
                </div>
                <div className="atr-details">
                  <span>{trip.driver.name}</span>
                  <span className="atr-sep">·</span>
                  <span>{trip.vehicle.name} ({trip.vehicle.registrationNumber})</span>
                </div>
                <span className="atr-live-badge">LIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .overview-root {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .overview-header { margin-bottom: 4px; }
        .overview-title { font-size: 24px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px; margin-bottom: 6px; }
        .overview-subtitle { font-size: 14.5px; color: #64748b; margin: 0; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }

        .stat-card {
          background: rgba(15,15,25,0.8); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px; padding: 24px;
          display: flex; flex-direction: column; gap: 16px;
          position: relative; overflow: hidden;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.5);
          border-color: color-mix(in srgb, var(--accent-color) 35%, transparent);
        }
        .stat-card::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--accent-color); opacity: 0.8;
        }

        .stat-card-header { display: flex; align-items: center; justify-content: space-between; }
        .stat-icon { font-size: 22px; width: 44px; height: 44px; background: rgba(255,255,255,0.03); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .stat-value { font-size: 32px; font-weight: 800; color: #f1f5f9; letter-spacing: -1px; }
        .stat-card-body { display: flex; flex-direction: column; gap: 4px; }
        .stat-card-title { font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 0; }
        .stat-card-desc { font-size: 13px; color: #64748b; line-height: 1.4; margin: 0; }
        .stat-card-action {
          margin-top: 8px; font-size: 13px; font-weight: 600; color: #818cf8;
          text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
          width: fit-content; transition: opacity 0.2s;
        }
        .stat-card-action:hover { opacity: 0.8; }

        /* Live dispatches */
        .active-trips-section {
          background: rgba(15,15,25,0.7); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px;
        }
        .section-header { display: flex; align-items: center; justify-content: space-between; }
        .section-title {
          font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          color: #475569; display: flex; align-items: center; gap: 8px; margin: 0;
        }
        .live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.05); }
        }
        .view-all-link { font-size: 12px; color: #6366f1; text-decoration: none; font-weight: 600; }
        .view-all-link:hover { opacity: 0.8; }

        .active-trips-list { display: flex; flex-direction: column; gap: 8px; }
        .active-trip-row {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          border-radius: 10px; padding: 12px 16px;
        }
        .atr-route { display: flex; align-items: center; gap: 8px; }
        .atr-source, .atr-dest { font-size: 14px; font-weight: 700; color: #e2e8f0; }
        .atr-arrow { color: #475569; }
        .atr-details { display: flex; gap: 6px; font-size: 12px; color: #64748b; flex: 1; }
        .atr-sep { color: #334155; }
        .atr-live-badge {
          font-size: 9px; font-weight: 800; letter-spacing: 1px;
          background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
