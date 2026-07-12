"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Play, X, Loader2, Info, MapPin, Navigation,
  FileText, Printer, Droplets, Wallet, ArrowRight
} from "lucide-react";
import { useSystemSettings } from "@/app/providers";

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
  const settings = useSystemSettings();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [search, setSearch] = useState("");
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [reportTrip, setReportTrip] = useState<Trip | null>(null);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const formatDistance = (km: number | null) => {
    if (km === null || km === undefined) return "—";
    const val = settings.distanceUnit === "miles" ? km * 0.621371 : km;
    return `${Math.round(val).toLocaleString()} ${settings.distanceUnit === "miles" ? "mi" : "km"}`;
  };

  const formatCost = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
        const distanceKm = settings.distanceUnit === "miles"
          ? parseFloat(plannedDistance) / 0.621371
          : parseFloat(plannedDistance);

        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, destination, cargoWeight, plannedDistance: distanceKm, vehicleId, driverId }),
        });
        const data = await res.json();
        if (!res.ok) { setServerError(data.error || "Failed to dispatch trip"); return; }
        setTrips([data, ...trips]);
        setIsDispatchOpen(false);
        resetForm();
        router.refresh();
      } catch {
        setServerError("Network error. Please try again.");
      }
    });
  };

  const totalCost = (expenses: Expense[]) => expenses.reduce((s, e) => s + e.cost, 0);

  const handlePrint = () => {
    window.print();
  };

  // Report breakdown helpers
  const fuelExpenses = (expenses: Expense[]) => expenses.filter((e) => e.type === "FUEL");
  const otherExpenses = (expenses: Expense[]) => expenses.filter((e) => e.type !== "FUEL");

  return (
    <div className="flex flex-col gap-6">
      {/* Print styles — only visible when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #trip-report-print, #trip-report-print * { visibility: visible !important; }
          #trip-report-print {
            position: fixed !important; top: 0; left: 0; width: 100%; height: auto;
            padding: 32px; background: #fff !important; color: #111 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
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
          onClick={() => setIsDispatchOpen(true)}
          className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <Play size={18} fill="currentColor" />
          Dispatch Trip
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {(["DISPATCHED", "COMPLETED", "CANCELLED"] as const).map((s) => {
          const count = trips.filter((t) => t.status === s).length;
          return (
            <div key={s} className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-1 shadow-lg border-l-4 ${STATUS_META[s].border}`}>
              <span className={`text-2xl font-bold ${STATUS_META[s].color.split(" ")[0]}`}>{count}</span>
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
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-center no-print">
          <Navigation className="h-12 w-12 text-slate-700" />
          <p className="text-sm">No trips found. Dispatch your first trip above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 no-print">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 shadow-xl hover:-translate-y-1 hover:border-slate-700 transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-100 truncate">{trip.source}</span>
                  <div className="text-slate-600 shrink-0"><ArrowRight size={14} /></div>
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
                  <span className="text-xs text-slate-300 font-medium truncate">{trip.vehicle.name} · {trip.vehicle.registrationNumber}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cargo</span>
                  <span className="text-xs text-slate-300 font-medium">{trip.cargoWeight} kg</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expenses</span>
                  <span className="text-xs text-slate-300 font-medium">{trip.expenses.length} · {formatCost(totalCost(trip.expenses))}</span>
                </div>
              </div>

              <button
                onClick={() => setReportTrip(trip)}
                className="flex items-center justify-center gap-2 mt-auto py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors text-xs font-bold"
              >
                <FileText size={14} />
                View Full Report
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {isDispatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100">Dispatch New Trip</h3>
              <button onClick={() => { setIsDispatchOpen(false); resetForm(); }} className="text-slate-500 hover:text-slate-300 transition-colors p-1"><X size={20} /></button>
            </div>

            <form onSubmit={handleDispatch} className="p-6 flex flex-col gap-5">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                  <Info size={16} />{serverError}
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Planned Distance ({settings.distanceUnit === "miles" ? "mi" : "km"})</label>
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
                      <option key={v.id} value={v.id} className="bg-slate-900">{v.name} · {v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  {availableVehicles.length === 0 && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1"><Info size={12} /> No vehicles currently available</p>
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
                      <option key={d.id} value={d.id} className="bg-slate-900">{d.name} · {d.licenseNumber}</option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1"><Info size={12} /> No drivers currently available</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-slate-800 pt-5">
                <button type="button" onClick={() => { setIsDispatchOpen(false); resetForm(); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors" disabled={isPending}>Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[140px] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending || availableVehicles.length === 0 || availableDrivers.length === 0}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play size={16} fill="currentColor" />}
                  Dispatch Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trip Report Modal */}
      {reportTrip && (
        <>
          {/* Screen modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/10 p-2 rounded-lg">
                    <FileText size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Trip Report</h3>
                    <p className="text-xs text-slate-500">{reportTrip.source} → {reportTrip.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Printer size={14} /> Export PDF
                  </button>
                  <button onClick={() => setReportTrip(null)} className="text-slate-500 hover:text-slate-300 transition-colors p-1"><X size={20} /></button>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full border border-current ${STATUS_META[reportTrip.status]?.color}`}>
                    {STATUS_META[reportTrip.status]?.label || reportTrip.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    Created {new Date(reportTrip.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                {/* Route */}
                <div className="bg-slate-950 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Origin</span>
                    <span className="text-xl font-bold text-slate-100">{reportTrip.source}</span>
                  </div>
                  <ArrowRight className="text-indigo-400 shrink-0" size={24} />
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Destination</span>
                    <span className="text-xl font-bold text-slate-100">{reportTrip.destination}</span>
                  </div>
                </div>

                {/* Trip Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Driver", value: reportTrip.driver.name },
                    { label: "License #", value: reportTrip.driver.licenseNumber },
                    { label: "Vehicle", value: reportTrip.vehicle.name },
                    { label: "Reg #", value: reportTrip.vehicle.registrationNumber },
                    { label: "Vehicle Type", value: reportTrip.vehicle.type },
                    { label: "Cargo Weight", value: `${reportTrip.cargoWeight} kg` },
                    { label: "Planned Distance", value: formatDistance(reportTrip.plannedDistance) },
                    { label: "Actual Distance", value: formatDistance(reportTrip.actualDistance) },
                    { label: "Fuel Consumed", value: reportTrip.fuelConsumed ? `${reportTrip.fuelConsumed} L` : "—" },
                    { label: "Start Time", value: reportTrip.startTime ? new Date(reportTrip.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" },
                    { label: "End Time", value: reportTrip.endTime ? new Date(reportTrip.endTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1 bg-slate-950/50 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
                      <span className="text-sm font-medium text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Expenses: Fuel */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Droplets size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Fuel Expenses</h4>
                    <span className="ml-auto text-xs text-slate-400">{fuelExpenses(reportTrip.expenses).length} entries</span>
                  </div>
                  {fuelExpenses(reportTrip.expenses).length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {fuelExpenses(reportTrip.expenses).map((e) => (
                        <div key={e.id} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-emerald-400 uppercase">Fuel Fill-up</span>
                            {e.description && <span className="text-xs text-slate-500">{e.description}</span>}
                            <span className="text-xs text-slate-500">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm font-bold text-slate-200">{formatCost(e.cost)}</span>
                            {e.liters > 0 && <span className="text-[10px] text-slate-500">{e.liters}L</span>}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                        <span className="text-xs font-bold text-emerald-400">Fuel Subtotal</span>
                        <span className="font-bold text-emerald-400">{formatCost(totalCost(fuelExpenses(reportTrip.expenses)))}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 bg-slate-950/50 rounded-xl p-4 text-center">No fuel expenses logged.</p>
                  )}
                </div>

                {/* Expenses: Other */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Wallet size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Other Expenses</h4>
                    <span className="ml-auto text-xs text-slate-400">{otherExpenses(reportTrip.expenses).length} entries</span>
                  </div>
                  {otherExpenses(reportTrip.expenses).length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {otherExpenses(reportTrip.expenses).map((e) => (
                        <div key={e.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-amber-400 uppercase">{e.type}</span>
                            {e.description && <span className="text-xs text-slate-500">{e.description}</span>}
                            <span className="text-xs text-slate-500">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-200">{formatCost(e.cost)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                        <span className="text-xs font-bold text-amber-400">Other Subtotal</span>
                        <span className="font-bold text-amber-400">{formatCost(totalCost(otherExpenses(reportTrip.expenses)))}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 bg-slate-950/50 rounded-xl p-4 text-center">No other expenses logged.</p>
                  )}
                </div>

                {/* Grand Total */}
                <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
                  <span className="font-bold text-slate-100">Total Trip Expenses</span>
                  <span className="text-2xl font-bold text-indigo-400">{formatCost(totalCost(reportTrip.expenses))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Print-only version */}
          <div id="trip-report-print" style={{ display: "none" }}>
            <div style={{ fontFamily: "sans-serif", color: "#111", padding: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", borderBottom: "2px solid #e2e8f0", paddingBottom: "16px" }}>
                <div>
                  <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 4px" }}>Trip Report</h1>
                  <p style={{ color: "#64748b", margin: 0 }}>{reportTrip.source} → {reportTrip.destination}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, margin: "0 0 4px" }}>Status: {STATUS_META[reportTrip.status]?.label}</p>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "12px" }}>Generated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>

              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>Trip Details</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
                <tbody>
                  {[
                    ["Driver", reportTrip.driver.name], ["License #", reportTrip.driver.licenseNumber],
                    ["Vehicle", `${reportTrip.vehicle.name} (${reportTrip.vehicle.type})`], ["Reg #", reportTrip.vehicle.registrationNumber],
                    ["Cargo Weight", `${reportTrip.cargoWeight} kg`], ["Planned Distance", formatDistance(reportTrip.plannedDistance)],
                    ["Actual Distance", formatDistance(reportTrip.actualDistance)],
                    ["Fuel Consumed", reportTrip.fuelConsumed ? `${reportTrip.fuelConsumed} L` : "—"],
                    ["Start Time", reportTrip.startTime ? new Date(reportTrip.startTime).toLocaleString() : "—"],
                    ["End Time", reportTrip.endTime ? new Date(reportTrip.endTime).toLocaleString() : "—"],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0", fontWeight: 600, color: "#64748b", width: "40%" }}>{label}</td>
                      <td style={{ padding: "8px 0" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>Fuel Expenses</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
                <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Description</th>
                  <th style={{ textAlign: "right", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Liters</th>
                  <th style={{ textAlign: "right", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Cost</th>
                </tr></thead>
                <tbody>
                  {fuelExpenses(reportTrip.expenses).map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0" }}>{new Date(e.date).toLocaleDateString()}</td>
                      <td style={{ padding: "8px 0" }}>{e.description || "Fuel fill-up"}</td>
                      <td style={{ textAlign: "right", padding: "8px 0" }}>{e.liters}L</td>
                      <td style={{ textAlign: "right", padding: "8px 0" }}>{formatCost(e.cost)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} style={{ textAlign: "right", fontWeight: 700, padding: "12px 0" }}>Fuel Subtotal</td>
                    <td style={{ textAlign: "right", fontWeight: 700, padding: "12px 0" }}>{formatCost(totalCost(fuelExpenses(reportTrip.expenses)))}</td></tr>
                </tbody>
              </table>

              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>Other Expenses</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
                <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Description</th>
                  <th style={{ textAlign: "right", padding: "8px 0", fontWeight: 700, fontSize: "12px", color: "#64748b" }}>Cost</th>
                </tr></thead>
                <tbody>
                  {otherExpenses(reportTrip.expenses).map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0" }}>{new Date(e.date).toLocaleDateString()}</td>
                      <td style={{ padding: "8px 0" }}>{e.type}</td>
                      <td style={{ padding: "8px 0" }}>{e.description || "—"}</td>
                      <td style={{ textAlign: "right", padding: "8px 0" }}>{formatCost(e.cost)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} style={{ textAlign: "right", fontWeight: 700, padding: "12px 0" }}>Other Subtotal</td>
                    <td style={{ textAlign: "right", fontWeight: 700, padding: "12px 0" }}>{formatCost(totalCost(otherExpenses(reportTrip.expenses)))}</td></tr>
                </tbody>
              </table>

              <div style={{ borderTop: "2px solid #111", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>TOTAL TRIP EXPENSES</span>
                <span style={{ fontWeight: 800, fontSize: "24px" }}>{formatCost(totalCost(reportTrip.expenses))}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
