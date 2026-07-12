import { auth, signOut } from "@/auth";
import { getPermissions } from "@/lib/permissions";
import SidebarLinks from "./SidebarLinks";
import { Truck, LogOut } from "lucide-react";

const menus = [
  {
    title: "Overview",
    href: "/dashboard",
    iconName: "LayoutDashboard",
  },
  {
    title: "Users & Drivers",
    href: "/dashboard/users",
    iconName: "Users",
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    iconName: "Truck",
  },
  {
    title: "Trips",
    href: "/trips",
    iconName: "Map",
  },
  {
    title: "Maintenance",
    href: "/maintenance",
    iconName: "Wrench",
  },
  {
    title: "Expenses",
    href: "/expences",
    iconName: "Wallet",
  },
  {
    title: "Fuel Logs",
    href: "/fuel-logs",
    iconName: "Droplets",
  },
  {
    title: "Reports",
    href: "/reports",
    iconName: "BarChart3",
  },
  {
    title: "Settings",
    href: "/settings",
    iconName: "Settings",
  },
];

export async function Sidebar() {
  const session = await auth();
  const userRole = session?.user?.role || "DRIVER";

  // Load permissions dynamically
  const permissions = getPermissions();

  const filteredMenus = menus.filter((menu) => {
    const allowedRoles = permissions[menu.title];
    if (!allowedRoles) return true;
    return allowedRoles.includes(userRole);
  });

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-950 flex-col">
      <div className="border-b border-slate-800 p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">TransitOps</h1>
      </div>

      <SidebarLinks menus={filteredMenus} />

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