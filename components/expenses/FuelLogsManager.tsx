"use client";

import { useState } from "react";
import { Search, Droplets } from "lucide-react";

interface FuelLog {
  id: string;
  type: string;
  amount: number;
  cost: number;
  liters: number;
  date: string;
  description: string | null;
  vehicle: { id: string; name: string; registrationNumber: string };
  trip: { id: string; source: string; destination: string } | null;
}

interface FuelLogsManagerProps {
  initialLogs: FuelLog[];
}

export default function FuelLogsManager({ initialLogs }: FuelLogsManagerProps) {
  const [search, setSearch] = useState("");

  const filtered = initialLogs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.vehicle.name.toLowerCase().includes(term) ||
      log.vehicle.registrationNumber.toLowerCase().includes(term) ||
      (log.description || "").toLowerCase().includes(term) ||
      (log.trip ? `${log.trip.source} ${log.trip.destination}`.toLowerCase() : "").includes(term)
    );
  });

  const totalLiters = filtered.reduce((s, l) => s + l.liters, 0);
  const totalCost = filtered.reduce((s, l) => s + l.cost, 0);
  const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <span className="text-2xl font-bold text-emerald-400">{initialLogs.length}</span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Total Fill-ups</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-blue-500">
          <span className="text-2xl font-bold text-blue-400">{initialLogs.reduce((s, l) => s + l.liters, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}L</span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Total Liters</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-indigo-500">
          <span className="text-2xl font-bold text-indigo-400">
            ${initialLogs.reduce((s, l) => s + l.cost, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Total Fuel Cost</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-amber-500">
          <span className="text-2xl font-bold text-amber-400">
            ${(initialLogs.reduce((s, l) => s + l.cost, 0) / Math.max(initialLogs.reduce((s, l) => s + l.liters, 0), 1)).toFixed(2)}/L
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Avg Cost/Liter</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search vehicle or trip route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 h-10 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>
        <div className="text-sm text-slate-400 flex gap-4">
          <span>{filtered.length} entries</span>
          <span className="text-slate-600">|</span>
          <span><span className="font-bold text-slate-200">{totalLiters.toFixed(1)}L</span> · <span className="font-bold text-slate-200">${totalCost.toFixed(2)}</span></span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trip Route</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Liters</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Cost</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">$/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Droplets size={14} className="text-emerald-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">{log.vehicle.name}</span>
                          <span className="text-xs font-mono text-slate-500">{log.vehicle.registrationNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {log.trip ? `${log.trip.source} → ${log.trip.destination}` : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {log.description || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-blue-400">{log.liters.toFixed(1)}L</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-200">${log.cost.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-slate-500">
                        {log.liters > 0 ? `$${(log.cost / log.liters).toFixed(2)}` : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Droplets size={40} className="text-slate-700" />
                      <p className="text-sm">No fuel logs found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
