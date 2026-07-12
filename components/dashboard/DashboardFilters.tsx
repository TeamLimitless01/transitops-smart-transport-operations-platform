"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

const VEHICLE_TYPES = ["ALL", "TRUCK", "VAN", "BUS", "PICKUP", "CAR", "OTHER"];
const VEHICLE_STATUSES = ["ALL", "AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];

export default function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "ALL";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentRegion = searchParams.get("region") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleReset = () => {
    router.push("/dashboard");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between shadow-xl">
      <div className="flex items-center gap-2 text-slate-400 mr-2 self-start md:self-auto">
        <SlidersHorizontal size={16} className="text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1">
        {/* Type selector */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle Type</label>
          <select
            value={currentType}
            onChange={(e) => updateFilters("type", e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer w-full"
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "All Types" : t}
              </option>
            ))}
          </select>
        </div>

        {/* Status selector */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle Status</label>
          <select
            value={currentStatus}
            onChange={(e) => updateFilters("status", e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer w-full"
          >
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Region Input */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1 md:max-w-xs">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Region</label>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Filter by region..."
              value={currentRegion}
              onChange={(e) => updateFilters("region", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Reset */}
        {(currentType !== "ALL" || currentStatus !== "ALL" || currentRegion !== "") && (
          <button
            onClick={handleReset}
            className="h-10 mt-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors self-end sm:self-auto"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
