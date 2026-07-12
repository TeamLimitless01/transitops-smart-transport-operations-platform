"use client";

import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/vehicles": "Vehicles Management",
  "/dashboard/users": "Users & Drivers",
  "/trips": "Trips Dispatch & Tracking",
  "/maintenance": "Maintenance",
  "/expenses": "Expenses",
  "/reports": "Reports",
};

export function Navbar({ user }: { user: any }) {
  const pathname = usePathname();
  const title = titles[pathname] || "TransitOps";
  
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-slate-400 hover:text-slate-100">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 outline-none hover:bg-slate-900 py-1.5 px-3 rounded-xl transition-colors">
          <Avatar className="h-9 w-9 border border-indigo-500/30">
            <AvatarFallback className="bg-indigo-950 text-indigo-400 font-semibold">{initials}</AvatarFallback>
          </Avatar>

          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{user?.name || "User"}</p>
            <p className="text-xs text-slate-400">
              {user?.role?.replace("_", " ") || "No Role"}
            </p>
          </div>

          <ChevronDown className="h-4 w-4 text-slate-500" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
          <div className="px-3 py-2 border-b border-slate-800 mb-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <DropdownMenuItem 
            className="text-red-400 cursor-pointer focus:bg-red-500/10 focus:text-red-400"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}