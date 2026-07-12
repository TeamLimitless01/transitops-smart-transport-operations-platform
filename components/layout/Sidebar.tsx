import Link from "next/link";
import { headers } from "next/headers";
import {
  LayoutDashboard,
  Truck,
  Users,
  Map,
  Wrench,
  Wallet,
  BarChart3,
  Droplets,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { auth, signOut } from "@/auth";
import { getPermissions } from "@/lib/permissions";

const menus = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users & Drivers",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    icon: Truck,
  },
  {
    title: "Trips",
    href: "/trips",
    icon: Map,
  },
  {
    title: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    title: "Expenses",
    href: "/expences",
    icon: Wallet,
  },
  {
    title: "Fuel Logs",
    href: "/fuel-logs",
    icon: Droplets,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: SettingsIcon,
  },
];

export async function Sidebar() {
  const session = await auth();
  const userRole = session?.user?.role || "DRIVER";

  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "/dashboard";

  // Load permissions dynamically
  const permissions = getPermissions();

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-950 flex-col">
      <div className="border-b border-slate-800 p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">TransitOps</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menus
          .filter((menu) => {
            const allowedRoles = permissions[menu.title];
            // If no permissions defined for a tab, default to allowing it
            if (!allowedRoles) return true;
            return allowedRoles.includes(userRole);
          })
          .map((menu) => {
            const Icon = menu.icon;
            const active = currentPath === menu.href || currentPath.startsWith(menu.href + "/");

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors text-sm font-medium
                  ${active
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
              >
                <Icon size={18} className={active ? "text-indigo-400" : "text-slate-500"} />
                <span>{menu.title}</span>
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors">
            <LogOut size={18} className="text-slate-500" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}