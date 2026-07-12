"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Truck,
  Users,
  Map,
  Wrench,
  Wallet,
  BarChart3,
  Droplets,
  Settings: SettingsIcon,
};

interface MenuItem {
  title: string;
  href: string;
  iconName: string;
}

interface SidebarLinksProps {
  menus: MenuItem[];
}

export default function SidebarLinks({ menus }: SidebarLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
      {menus.map((menu) => {
        const Icon = ICON_MAP[menu.iconName] || LayoutDashboard;
        const active = menu.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname === menu.href || pathname.startsWith(menu.href + "/");

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={`flex items-center gap-3 py-3 transition-all text-sm font-medium
              ${active
                ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 rounded-r-lg pl-3.5"
                : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 rounded-lg px-4"
              }`}
          >
            <Icon size={18} className={active ? "text-indigo-400" : "text-slate-500"} />
            <span>{menu.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
