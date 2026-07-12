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
  LogOut,
} from "lucide-react";
import { auth, signOut } from "@/auth";

const menus = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "FLEET_MANAGER", "DRIVER"],
  },
  {
    title: "Users & Drivers",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN", "FLEET_MANAGER"],
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    icon: Truck,
    roles: ["ADMIN", "FLEET_MANAGER"],
  },
  {
    title: "Trips",
    href: "/trips",
    icon: Map,
    roles: ["ADMIN", "FLEET_MANAGER", "DRIVER"],
  },
];

export async function Sidebar() {
  const session = await auth();
  const userRole = session?.user?.role || "DRIVER";

  // Use headers() to get the current pathname on the server component
  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "/dashboard";

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-950 flex-col">
      <div className="border-b border-slate-800 p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">TransitOps</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        {menus
          .filter((menu) => menu.roles.includes(userRole))
          .map((menu) => {
            const Icon = menu.icon;
            // Match exactly or starts with (for nested routes)
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