import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  // Query operations stats in parallel
  const [userCount, vehicleCount, driverCount, tripCount] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.driver.count(),
    prisma.trip.count(),
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
      link: "#",
    },
    {
      title: "Active Drivers",
      value: driverCount,
      desc: "Qualified personnel",
      color: "#f59e0b",
      icon: "🧑‍✈️",
      link: "#",
    },
    {
      title: "Trips Dispatched",
      value: tripCount,
      desc: "Active and completed trips",
      color: "#3b82f6",
      icon: "🛣️",
      link: "#",
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
            {stat.link !== "#" ? (
              <Link href={stat.link} className="stat-card-action">
                Manage
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            ) : (
              <span className="stat-card-action disabled">
                Locked
              </span>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .overview-root {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .overview-header {
          margin-bottom: 4px;
        }

        .overview-title {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .overview-subtitle {
          font-size: 14.5px;
          color: #64748b;
        }

        /* Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        /* Card */
        .stat-card {
          background: rgba(15, 15, 25, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
        }
        .stat-card:hover {
          border-color: rgba(var(--accent-color), 0.35);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.5);
        }
        .stat-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: var(--accent-color);
          opacity: 0.8;
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-icon {
          font-size: 22px;
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -1px;
        }

        .stat-card-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .stat-card-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }

        .stat-card-action {
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #818cf8;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .stat-card-action:hover:not(.disabled) {
          opacity: 0.8;
        }
        .stat-card-action.disabled {
          color: #334155;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
