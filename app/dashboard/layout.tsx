import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="dash-container">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l4-8 4 4 4-6 4 10H3z" fill="#6366f1" opacity="0.9"/>
              <rect x="2" y="17" width="20" height="2" rx="1" fill="#6366f1"/>
              <circle cx="6" cy="20" r="1.5" fill="#a5b4fc"/>
              <circle cx="18" cy="20" r="1.5" fill="#a5b4fc"/>
            </svg>
          </div>
          <span className="dash-brand">TransitOps</span>
        </div>

        {/* User Card */}
        <div className="dash-user-card">
          <div className="dash-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="dash-user-info">
            <div className="dash-username">{userName}</div>
            <div className="dash-role-badge" data-role={userRole}>
              {userRole?.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            Overview
          </Link>

          {userRole === "FLEET_MANAGER" && (
            <Link href="/dashboard/users" className="dash-nav-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              User Management
            </Link>
          )}

          <div className="dash-nav-sep">Operations</div>

          <a href="#" className="dash-nav-link disabled-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            Vehicles
          </a>

          <a href="#" className="dash-nav-link disabled-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Trips
          </a>
        </nav>

        {/* Footer / Sign Out */}
        <div className="dash-sidebar-footer">
          <form action={handleSignOut}>
            <button className="dash-logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main">
        <header className="dash-main-header">
          <div className="dash-header-title">
            TransitOps Dashboard
          </div>
          <div className="dash-header-meta">
            <span className="dash-date">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </header>

        <div className="dash-content-body">
          {children}
        </div>
      </main>

      <style>{`
        .dash-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 260px 1fr;
          background: #06060a;
          color: #f1f5f9;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }

        /* Sidebar styling */
        .dash-sidebar {
          background: #0b0b12;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
        }

        .dash-sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          padding-left: 8px;
        }

        .dash-logo {
          width: 38px;
          height: 38px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dash-brand {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        /* User Card */
        .dash-user-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }

        .dash-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: white;
          box-shadow: 0 4px 12px rgba(99,102,241,0.2);
        }

        .dash-user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .dash-username {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dash-role-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: 20px;
          width: fit-content;
        }
        .dash-role-badge[data-role="FLEET_MANAGER"] {
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
        }
        .dash-role-badge[data-role="DRIVER"] {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.3);
          color: #6ee7b7;
        }
        .dash-role-badge[data-role="SAFETY_OFFICER"] {
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.3);
          color: #fcd34d;
        }
        .dash-role-badge[data-role="FINANCIAL_ANALYST"] {
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.3);
          color: #93c5fd;
        }

        /* Navigation */
        .dash-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .dash-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
        }
        .dash-nav-link:hover {
          background: rgba(255,255,255,0.03);
          color: #e2e8f0;
        }
        .dash-nav-link.active-link {
          background: rgba(99,102,241,0.1);
          color: #818cf8;
          font-weight: 600;
        }

        .disabled-link {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }

        .dash-nav-sep {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 1px;
          margin-top: 18px;
          margin-bottom: 6px;
          padding-left: 12px;
        }

        /* Sign out */
        .dash-sidebar-footer {
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .dash-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #f87171;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .dash-logout-btn:hover {
          background: rgba(239,68,68,0.08);
        }

        /* Main Content */
        .dash-main {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow-y: auto;
        }

        .dash-main-header {
          height: 70px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background: #09090f;
        }

        .dash-header-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #e2e8f0;
        }

        .dash-date {
          font-size: 13.5px;
          color: #64748b;
        }

        .dash-content-body {
          padding: 32px;
          flex: 1;
        }

        @media (max-width: 768px) {
          .dash-container {
            grid-template-columns: 1fr;
          }
          .dash-sidebar {
            display: none; /* simple sidebar hide for mobile, full responsiveness can be implemented */
          }
        }
      `}</style>
    </div>
  );
}
