"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Wrench, CheckCircle2, X, Loader2, Clock, Info } from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  type: string;
  model: string;
  status: string;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
  vehicle: {
    id: string;
    name: string;
    registrationNumber: string;
    type: string;
    model: string;
  };
}

interface MaintenanceManagerProps {
  initialRecords: MaintenanceRecord[];
  vehicles: Vehicle[];
}

const STATUS_META: Record<string, { label: string; color: string; border: string }> = {
  ACTIVE: { label: "In Maintenance", color: "text-amber-400 bg-amber-500/10", border: "border-amber-500" },
  COMPLETED: { label: "Completed", color: "text-emerald-400 bg-emerald-500/10", border: "border-emerald-500" },
};

export default function MaintenanceManager({ initialRecords, vehicles }: MaintenanceManagerProps) {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Form state
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const availableVehicles = vehicles.filter((v) => v.status !== "ON_TRIP" && v.status !== "IN_SHOP");

  const resetForm = () => {
    setVehicleId(""); setDescription(""); setCost("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setServerError(null);
  };

  const filteredRecords = records.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      r.vehicle.name.toLowerCase().includes(term) ||
      r.vehicle.registrationNumber.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term);
    const matchesFilter = filter === "ALL" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId, description, cost, startDate }),
        });
        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || "Failed to create maintenance record");
          return;
        }
        setRecords([data, ...records]);
        setIsModalOpen(false);
        resetForm();
        router.refresh();
      } catch {
        setServerError("Network error. Please try again.");
      }
    });
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Mark this maintenance as completed and free up the vehicle?")) return;
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) { alert("Failed to complete maintenance"); return; }
      const updated = await res.json();
      setRecords(records.map((r) => (r.id === id ? updated : r)));
      router.refresh();
    } catch {
      alert("Network error.");
    }
  };

  const activeCount = records.filter((r) => r.status === "ACTIVE").length;
  const completedCount = records.filter((r) => r.status === "COMPLETED").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-amber-500">
          <span className="text-2xl font-bold text-amber-400">{activeCount}</span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">In Maintenance</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <span className="text-2xl font-bold text-emerald-400">{completedCount}</span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Completed</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-indigo-500">
          <span className="text-2xl font-bold text-indigo-400">{records.length}</span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Total Records</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-blue-500">
          <span className="text-2xl font-bold text-blue-400">
            ${records.reduce((s, r) => s + r.cost, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Total Costs</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search vehicle or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 h-10 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(["ALL", "ACTIVE", "COMPLETED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                {f === "ALL" ? "All" : f === "ACTIVE" ? "Active" : "Completed"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 bg-amber-500 hover:bg-amber-600 text-white px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus size={18} />
          Schedule Maintenance
        </button>
      </div>

      {/* Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Issue / Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cost</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">End Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Wrench size={16} className="text-amber-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{record.vehicle.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{record.vehicle.registrationNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-xs">
                      <span className="line-clamp-2">{record.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border border-current ${STATUS_META[record.status]?.color}`}>
                        {STATUS_META[record.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-300">
                      ${record.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {record.startDate ? new Date(record.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {record.endDate ? new Date(record.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Clock size={14} />
                          <span className="text-xs font-semibold">Ongoing</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {record.status === "ACTIVE" && (
                        <button
                          onClick={() => handleComplete(record.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                        >
                          <CheckCircle2 size={14} />
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Wrench size={40} className="text-slate-700" />
                      <p className="text-sm">No maintenance records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <Wrench size={18} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Schedule Maintenance</h3>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                  <Info size={16} />{serverError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Vehicle
                  <span className="ml-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] normal-case">{availableVehicles.length} available</span>
                </label>
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
                  <option value="">— Select a vehicle —</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-900">{v.name} · {v.registrationNumber} ({v.type})</option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-[10px] text-amber-400 flex items-center gap-1"><Info size={12} /> All vehicles are either on a trip or already in maintenance.</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Issue / Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="Describe the maintenance work to be done..."
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none placeholder:text-slate-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Cost ($)</label>
                  <input type="number" min="0" step="0.01" placeholder="e.g. 1200" value={cost} onChange={(e) => setCost(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-slate-800 pt-5">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[160px] gap-2 disabled:opacity-70"
                  disabled={isPending || availableVehicles.length === 0}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wrench size={16} /> Schedule</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
