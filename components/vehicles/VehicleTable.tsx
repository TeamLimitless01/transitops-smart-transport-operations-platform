"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Truck, X, Loader2 } from "lucide-react";

interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string | null;
  status: string;
  createdAt: string;
}

interface VehicleTableProps {
  initialVehicles: Vehicle[];
}

const VEHICLE_TYPES = ["TRUCK", "VAN", "BUS", "PICKUP", "CAR", "OTHER"];
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ON_TRIP: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IN_SHOP: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  RETIRED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function VehicleTable({ initialVehicles }: VehicleTableProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("TRUCK");
  const [maxLoadCapacity, setMaxLoadCapacity] = useState("");
  const [odometer, setOdometer] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [region, setRegion] = useState("");

  const [serverError, setServerError] = useState<string | null>(null);

  // Filtered Vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const term = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(term) ||
      v.registrationNumber.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term)
    );
  });

  const resetForm = () => {
    setRegistrationNumber(""); setName(""); setModel(""); setType("TRUCK");
    setMaxLoadCapacity(""); setOdometer(""); setAcquisitionCost(""); setRegion("");
    setServerError(null);
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationNumber, name, model, type,
            maxLoadCapacity, odometer, acquisitionCost,
            region: region || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setServerError(data.message || "Failed to create vehicle");
          return;
        }

        setVehicles([data.data, ...vehicles]);
        setIsModalOpen(false);
        resetForm();
        router.refresh();
      } catch (err) {
        setServerError("Network error. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, reg number, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <Plus size={18} />
          Add Vehicle
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Reg Number</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Capacity</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Odometer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50">
                          <Truck size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{vehicle.name}</span>
                          <span className="text-xs text-slate-500">{vehicle.model}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-slate-950 px-2 py-1 rounded text-slate-400 border border-slate-800">{vehicle.registrationNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">{vehicle.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{vehicle.maxLoadCapacity} kg</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLORS[vehicle.status] || "bg-slate-800 text-slate-400 border-slate-700"}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{vehicle.odometer.toLocaleString()} km</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No vehicles found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100">Add New Vehicle</h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="p-6 flex flex-col gap-5">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration Number</label>
                  <input type="text" required placeholder="e.g. ABC-1234" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle Name</label>
                  <input type="text" required placeholder="e.g. Truck Alpha" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</label>
                  <input type="text" required placeholder="e.g. Volvo FH16" value={model} onChange={(e) => setModel(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Max Load Capacity (kg)</label>
                  <input type="number" required min="0" placeholder="e.g. 15000" value={maxLoadCapacity} onChange={(e) => setMaxLoadCapacity(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Odometer (km)</label>
                  <input type="number" required min="0" placeholder="e.g. 50000" value={odometer} onChange={(e) => setOdometer(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Acquisition Cost ($)</label>
                  <input type="number" required min="0" placeholder="e.g. 120000" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Region (Optional)</label>
                  <input type="text" placeholder="e.g. North East" value={region} onChange={(e) => setRegion(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-70"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
