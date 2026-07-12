"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Navigation, Play, X, Loader2, Info } from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  type: string;
  status: string;
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  status: string;
}

interface Expense {
  id: string;
  type: string;
  amount: number;
  liters: number;
  cost: number;
  date: string;
  description: string | null;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  fuelConsumed: number | null;
  status: string;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  vehicle: { id: string; name: string; registrationNumber: string; type: string };
  driver: { id: string; name: string; licenseNumber: string };
  expenses: Expense[];
}

interface TripsManagerProps {
  initialTrips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

const STATUS_META: Record<string, { label: string; color: string; border: string }> = {
  DRAFT: { label: "Draft", color: "text-slate-400 bg-slate-500/10", border: "border-slate-500" },
  DISPATCHED: { label: "Dispatched", color: "text-blue-400 bg-blue-500/10", border: "border-blue-500" },
  COMPLETED: { label: "Completed", color: "text-emerald-400 bg-emerald-500/10", border: "border-emerald-500" },
  CANCELLED: { label: "Cancelled", color: "text-red-400 bg-red-500/10", border: "border-red-500" },
};

export default function TripsManager({ initialTrips, vehicles, drivers }: TripsManagerProps) {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Form state
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [plannedDistance, setPlannedDistance] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const availableDrivers = drivers.filter((d) => d.status === "AVAILABLE");

  const filteredTrips = trips.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.source.toLowerCase().includes(term) ||
      t.destination.toLowerCase().includes(term) ||
      t.driver.name.toLowerCase().includes(term) ||
      t.vehicle.name.toLowerCase().includes(term) ||
      t.vehicle.registrationNumber.toLowerCase().includes(term)
    );
  });

  const resetForm = () => {
    setSource(""); setDestination(""); setCargoWeight("");
    setPlannedDistance(""); setVehicleId(""); setDriverId("");
    setServerError(null);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, destination, cargoWeight, plannedDistance, vehicleId, driverId }),
        });

        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || "Failed to dispatch trip");
          return;
        }

        setTrips([data, ...trips]);
        setIsModalOpen(false);
        resetForm();
        router.refresh();
      } catch {
        setServerError("Network error. Please try again.");
      }
    });
  };

  const totalCost = (expenses: Expense[]) =>
    expenses.reduce((s, e) => s + e.cost, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by route, driver, or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <Play size={18} fill="currentColor" />
          Dispatch Trip
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["DISPATCHED", "COMPLETED", "CANCELLED"] as const).map((s) => {
          const count = trips.filter((t) => t.status === s).length;
          return (
            <div key={s} className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-1 shadow-lg border-l-4 ${STATUS_META[s].border}`}>
              <span className={`text-2xl font-bold ${STATUS_META[s].color.split(' ')[0]}`}>{count}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{STATUS_META[s].label}</span>
            </div>
          );
        })}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-1 shadow-lg border-l-4 border-indigo-500">
          <span className="text-2xl font-bold text-indigo-400">{trips.length}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Trips</span>
        </div>
      </div>

      {/* Trip Cards */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-center">
          <Navigation className="h-12 w-12 text-slate-700" />
          <p className="text-sm">No trips found. Dispatch your first trip above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 shadow-xl hover:-translate-y-1 hover:border-slate-700 transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-100 truncate">{trip.source}</span>
                  <div className="text-slate-600 shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-100 truncate">{trip.destination}</span>
                </div>
                <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border border-current ${STATUS_META[trip.status]?.color || "text-slate-400 bg-slate-500/10"} uppercase shrink-0`}>
                  {STATUS_META[trip.status]?.label || trip.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-4 border-t border-slate-800">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Driver</span>
                  <span className="text-xs text-slate-300 font-medium truncate">{trip.driver.name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle</span>
                  <span className="text-xs text-slate-300 font-medium truncate">{trip.vehicle.name} &bull; {trip.vehicle.registrationNumber}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cargo</span>
                  <span className="text-xs text-slate-300 font-medium">{trip.cargoWeight} kg</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Distance</span>
                  <span className="text-xs text-slate-300 font-medium">{trip.plannedDistance} km planned</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expenses</span>
                  <span className="text-xs text-slate-300 font-medium">{trip.expenses.length} entries &bull; ${totalCost(trip.expenses).toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Started</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {trip.startTime
                      ? new Date(trip.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100">Dispatch New Trip</h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="p-6 flex flex-col gap-5">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                  <Info size={16} />
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Source / Origin</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input type="text" placeholder="City or depot" value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input type="text" placeholder="City or address" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cargo Weight (kg)</label>
                  <input type="number" placeholder="e.g. 2500" min="0" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Planned Distance (km)</label>
                  <input type="number" placeholder="e.g. 340" min="0" value={plannedDistance} onChange={(e) => setPlannedDistance(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" required />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    Assign Vehicle
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">{availableVehicles.length} available</span>
                  </label>
                  <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" required>
                    <option value="" className="text-slate-500">— Select a vehicle —</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id} className="bg-slate-900">{v.name} &bull; {v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  {availableVehicles.length === 0 && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1"><Info size={12}/> No vehicles currently available</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    Assign Driver
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">{availableDrivers.length} available</span>
                  </label>
                  <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" required>
                    <option value="" className="text-slate-500">— Select a driver —</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900">{d.name} &bull; {d.licenseNumber}</option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1"><Info size={12}/> No drivers currently available</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-slate-800 pt-5">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[140px] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending || availableVehicles.length === 0 || availableDrivers.length === 0}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play size={16} fill="currentColor" />}
                  Dispatch Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
