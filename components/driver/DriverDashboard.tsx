"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Circle, Plus, X, Loader2, Check } from "lucide-react";
import { useSystemSettings } from "@/app/providers";

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

interface DriverDashboardProps {
  driverName: string;
  trips: Trip[];
}

const STATUS_META: Record<string, { label: string; text: string; bg: string }> = {
  DRAFT:      { label: "Draft",      text: "text-slate-400", bg: "bg-slate-500/10" },
  DISPATCHED: { label: "On Trip",    text: "text-blue-400",  bg: "bg-blue-500/10" },
  COMPLETED:  { label: "Completed",  text: "text-emerald-400", bg: "bg-emerald-500/10" },
  CANCELLED:  { label: "Cancelled",  text: "text-red-400",   bg: "bg-red-500/10" },
};

const EXPENSE_TYPES = ["FUEL", "MAINTENANCE", "TOLL", "PARKING", "OTHER"];

export default function DriverDashboard({ driverName, trips }: DriverDashboardProps) {
  const router = useRouter();
  const settings = useSystemSettings();
  const [allTrips, setAllTrips] = useState<Trip[]>(trips);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Complete Trip Form State
  const [actualDistance, setActualDistance] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");

  const formatDistance = (km: number | null) => {
    if (km === null || km === undefined) return "—";
    const val = settings.distanceUnit === "miles" ? km * 0.621371 : km;
    return `${Math.round(val).toLocaleString()} ${settings.distanceUnit === "miles" ? "mi" : "km"}`;
  };

  const formatCost = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Expense form
  const [expType, setExpType] = useState("FUEL");
  const [expAmount, setExpAmount] = useState("");
  const [expLiters, setExpLiters] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);

  const activeTrip = allTrips.find((t) => t.status === "DISPATCHED");
  const pastTrips = allTrips.filter((t) => t.status !== "DISPATCHED");

  const resetExpForm = () => {
    setExpType("FUEL"); setExpAmount(""); setExpLiters("");
    setExpDescription(""); setExpDate(new Date().toISOString().split("T")[0]);
    setServerError(null);
  };

  const openTripDetail = (trip: Trip) => {
    setSelectedTrip(trip);
    setExpenseModalOpen(false);
    resetExpForm();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setServerError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: selectedTrip.id,
            type: expType,
            amount: expAmount,
            liters: expType === "FUEL" ? expLiters : "0",
            description: expDescription,
            date: expDate,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || "Failed to add expense");
          return;
        }

        // Update local state
        const updatedTrips = allTrips.map((t) => {
          if (t.id === selectedTrip.id) {
            return { ...t, expenses: [...t.expenses, data] };
          }
          return t;
        });
        setAllTrips(updatedTrips);
        setSelectedTrip({ ...selectedTrip, expenses: [...selectedTrip.expenses, data] });
        setExpenseModalOpen(false);
        resetExpForm();
        router.refresh();
      } catch {
        setServerError("Network error. Please try again.");
      }
    });
  };

  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setServerError(null);

    startTransition(async () => {
      try {
        const distanceKm = settings.distanceUnit === "miles"
          ? parseFloat(actualDistance) / 0.621371
          : parseFloat(actualDistance);

        const res = await fetch(`/api/trips/${selectedTrip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            actualDistance: distanceKm,
            fuelConsumed: parseFloat(fuelConsumed),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || "Failed to complete trip");
          return;
        }

        const updatedTrips = allTrips.map((t) => t.id === selectedTrip.id ? data : t);
        setAllTrips(updatedTrips);
        setSelectedTrip(data);
        setCompleteModalOpen(false);
        setActualDistance("");
        setFuelConsumed("");
        router.refresh();
      } catch (err) {
        setServerError("Network error. Please try again.");
      }
    });
  };

  const totalExpenses = (expenses: Expense[]) => expenses.reduce((s, e) => s + e.cost, 0);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">Welcome back, {driverName} 👋</h1>
          <p className="text-slate-400 mt-1">Here's your trip overview for today</p>
        </div>
        <div className="flex gap-8 md:gap-12">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-indigo-400">{allTrips.length}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Total Trips</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-emerald-400">{pastTrips.filter(t => t.status === "COMPLETED").length}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Completed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Active + History */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Trip */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Current Trip
            </h2>
            
            {activeTrip ? (
              <div 
                onClick={() => openTripDetail(activeTrip)}
                className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-5 md:p-6 cursor-pointer hover:bg-blue-950/30 hover:border-blue-800/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl md:text-2xl font-bold text-slate-100">{activeTrip.source}</span>
                    <ArrowRight className="text-slate-500" />
                    <span className="text-xl md:text-2xl font-bold text-slate-100">{activeTrip.destination}</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest bg-blue-500 text-white px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)]">
                    LIVE
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle</span>
                    <span className="text-sm font-medium text-slate-300">{activeTrip.vehicle.name} &bull; {activeTrip.vehicle.registrationNumber}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cargo</span>
                    <span className="text-sm font-medium text-slate-300">{activeTrip.cargoWeight} kg</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Distance</span>
                    <span className="text-sm font-medium text-slate-300">{formatDistance(activeTrip.plannedDistance)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expenses</span>
                    <span className="text-sm font-medium text-slate-300">{activeTrip.expenses.length} &bull; {formatCost(totalExpenses(activeTrip.expenses))}</span>
                  </div>
                </div>
                
                <p className="text-xs font-medium text-blue-400 mt-5 group-hover:text-blue-300 transition-colors">
                  Click to log expenses or complete trip &rarr;
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                <Circle className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No active trip. You're currently off duty.</p>
              </div>
            )}
          </div>

          {/* Trip History */}
          {pastTrips.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trip History</h2>
              <div className="flex flex-col gap-2">
                {pastTrips.map((trip) => (
                  <div 
                    key={trip.id} 
                    onClick={() => openTripDetail(trip)}
                    className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-200">{trip.source}</span>
                      <span className="text-slate-600 text-xs">&rarr;</span>
                      <span className="text-sm font-bold text-slate-200">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-500 hidden sm:block">
                        {new Date(trip.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className={`font-bold px-2.5 py-1 rounded-md ${STATUS_META[trip.status]?.bg} ${STATUS_META[trip.status]?.text}`}>
                        {STATUS_META[trip.status]?.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Trip Detail Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            {selectedTrip ? (
              <div className="flex flex-col gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-slate-100 leading-tight">
                      {selectedTrip.source} &rarr; {selectedTrip.destination}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit ${STATUS_META[selectedTrip.status]?.bg} ${STATUS_META[selectedTrip.status]?.text}`}>
                    {STATUS_META[selectedTrip.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle</span><span className="text-sm font-medium text-slate-300">{selectedTrip.vehicle.name}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reg #</span><span className="text-sm font-medium text-slate-300">{selectedTrip.vehicle.registrationNumber}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cargo</span><span className="text-sm font-medium text-slate-300">{selectedTrip.cargoWeight} kg</span></div>
                  <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Planned Dist.</span><span className="text-sm font-medium text-slate-300">{formatDistance(selectedTrip.plannedDistance)}</span></div>
                </div>

                {/* Expenses */}
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Expenses</span>
                    {selectedTrip.status === "DISPATCHED" && (
                      <button 
                        onClick={() => setExpenseModalOpen(true)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Add
                      </button>
                    )}
                  </div>

                  {selectedTrip.expenses.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No expenses logged yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedTrip.expenses.map((exp) => (
                         <div key={exp.id} className="flex items-center justify-between bg-slate-950/50 border border-slate-800/60 rounded-xl p-3">
                           <div className="flex flex-col gap-0.5">
                             <span className="text-[10px] font-bold uppercase text-slate-400">{exp.type}</span>
                             {exp.description && <span className="text-xs text-slate-500">{exp.description}</span>}
                           </div>
                           <div className="flex flex-col items-end gap-0.5">
                             <span className="text-sm font-bold text-emerald-400">{formatCost(exp.cost)}</span>
                             {exp.type === "FUEL" && exp.liters > 0 && (
                               <span className="text-[10px] font-semibold text-slate-500">{exp.liters}L</span>
                             )}
                           </div>
                         </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-800">
                        <span className="text-sm font-bold text-slate-300">Total</span>
                        <span className="text-lg font-bold text-slate-100">{formatCost(totalExpenses(selectedTrip.expenses))}</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedTrip.status === "DISPATCHED" && (
                  <button
                    onClick={() => setCompleteModalOpen(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl font-bold transition-colors"
                  >
                    <Check size={18} /> Mark as Completed
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 h-[400px] bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                <Circle className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">Select a trip to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {expenseModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-100">Log Expense</h3>
              <button 
                onClick={() => { setExpenseModalOpen(false); resetExpForm(); }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-6 flex flex-col gap-4 overflow-y-auto">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                  {serverError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Expense Type</label>
                <select 
                  value={expType} 
                  onChange={(e) => setExpType(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {expType === "FUEL" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Liters</label>
                  <input 
                    type="number" min="0" step="0.01" placeholder="e.g. 45.5" 
                    value={expLiters} onChange={(e) => setExpLiters(e.target.value)} 
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount ({settings.currencySymbol})</label>
                <input 
                  type="number" min="0" step="0.01" placeholder="e.g. 78.50" 
                  value={expAmount} onChange={(e) => setExpAmount(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                <input 
                  type="date" 
                  value={expDate} onChange={(e) => setExpDate(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description (optional)</label>
                <input 
                  type="text" placeholder="e.g. Fuel at Shell station" 
                  value={expDescription} onChange={(e) => setExpDescription(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  onClick={() => { setExpenseModalOpen(false); resetExpForm(); }} 
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {completeModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-100">Complete Trip</h3>
              <button 
                onClick={() => { setCompleteModalOpen(false); setActualDistance(""); setFuelConsumed(""); setServerError(null); }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCompleteTrip} className="p-6 flex flex-col gap-4 overflow-y-auto">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                  {serverError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Actual Distance ({settings.distanceUnit === "miles" ? "mi" : "km"})</label>
                <input 
                  type="number" min="0" step="0.1" placeholder={settings.distanceUnit === "miles" ? "e.g. 210" : "e.g. 340"} 
                  value={actualDistance} onChange={(e) => setActualDistance(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fuel Consumed (Liters)</label>
                <input 
                  type="number" min="0" step="0.1" placeholder="e.g. 45" 
                  value={fuelConsumed} onChange={(e) => setFuelConsumed(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  onClick={() => { setCompleteModalOpen(false); setActualDistance(""); setFuelConsumed(""); setServerError(null); }} 
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
