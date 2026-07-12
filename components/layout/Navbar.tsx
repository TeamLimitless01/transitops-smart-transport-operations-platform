"use client";

import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, LogOut } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/vehicles": "Vehicles",
  "/drivers": "Drivers",
  "/trips": "Trips",
  "/maintenance": "Maintenance",
  "/expenses": "Expenses",
  "/reports": "Reports",
};

export function Navbar() {
  const pathname = usePathname();

  const title = titles[pathname] || "TransitOps";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
          <Avatar>
            <AvatarFallback>FM</AvatarFallback>
          </Avatar>

          <div className="text-left">
            <p className="font-medium">Fleet Manager</p>
            <p className="text-sm text-muted-foreground">
              admin@transitops.com
            </p>
          </div>

          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-red-500 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}