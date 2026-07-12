"use client";

import { useState } from "react";
import { Search, Wallet, SlidersHorizontal } from "lucide-react";

interface Expense {
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

interface ExpensesManagerProps {
  initialExpenses: Expense[];
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  MAINTENANCE: { label: "Maintenance", color: "text-amber-400 bg-amber-500/10" },
  TOLL: { label: "Toll", color: "text-blue-400 bg-blue-500/10" },
  PARKING: { label: "Parking", color: "text-purple-400 bg-purple-500/10" },
  OTHER: { label: "Other", color: "text-slate-400 bg-slate-500/10" },
  FUEL: { label: "Fuel", color: "text-emerald-400 bg-emerald-500/10" },
};

const TYPES = ["ALL", "MAINTENANCE", "TOLL", "PARKING", "OTHER"];

export default function ExpensesManager({ initialExpenses }: ExpensesManagerProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filtered = initialExpenses.filter((e) => {
    const term = search.toLowerCase();
    const matchesSearch =
      e.vehicle.name.toLowerCase().includes(term) ||
      e.vehicle.registrationNumber.toLowerCase().includes(term) ||
      (e.description || "").toLowerCase().includes(term) ||
      (e.trip ? `${e.trip.source} ${e.trip.destination}` : "").toLowerCase().includes(term);
    const matchesType = typeFilter === "ALL" || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCost = filtered.reduce((s, e) => s + e.cost, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TYPES.filter((t) => t !== "ALL").map((type) => {
          const count = initialExpenses.filter((e) => e.type === type).length;
          const total = initialExpenses.filter((e) => e.type === type).reduce((s, e) => s + e.cost, 0);
          return (
            <div key={type} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-full ${TYPE_META[type].color}`}>{TYPE_META[type].label}</span>
                <span className="text-xs text-slate-500">{count} entries</span>
              </div>
              <p className="text-2xl font-bold text-slate-100 mt-3">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search vehicle, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 h-10 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${typeFilter === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
                {t === "ALL" ? "All" : TYPE_META[t]?.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-slate-400">
          Total: <span className="font-bold text-slate-200">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trip Route</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200">{expense.vehicle.name}</span>
                        <span className="text-xs font-mono text-slate-500">{expense.vehicle.registrationNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${TYPE_META[expense.type]?.color || "text-slate-400 bg-slate-500/10"}`}>
                        {TYPE_META[expense.type]?.label || expense.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {expense.trip ? `${expense.trip.source} → ${expense.trip.destination}` : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {expense.description || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-200">${expense.cost.toFixed(2)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Wallet size={40} className="text-slate-700" />
                      <p className="text-sm">No expenses found matching your search.</p>
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
