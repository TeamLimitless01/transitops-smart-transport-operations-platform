"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "#64748b" },
  DISPATCHED: { label: "Dispatched", color: "#3b82f6" },
  COMPLETED: { label: "Completed", color: "#10b981" },
  CANCELLED: { label: "Cancelled", color: "#ef4444" },
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
    <div className="trips-root">
      {/* Header */}
      <div className="trips-header">
        <div className="search-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by route, driver, or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="dispatch-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Dispatch Trip
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        {(["DISPATCHED", "COMPLETED", "CANCELLED"] as const).map((s) => {
          const count = trips.filter((t) => t.status === s).length;
          return (
            <div key={s} className="stat-card" style={{ "--s-color": STATUS_META[s].color } as React.CSSProperties}>
              <span className="stat-count">{count}</span>
              <span className="stat-label">{STATUS_META[s].label}</span>
            </div>
          );
        })}
        <div className="stat-card" style={{ "--s-color": "#a78bfa" } as React.CSSProperties}>
          <span className="stat-count">{trips.length}</span>
          <span className="stat-label">Total Trips</span>
        </div>
      </div>

      {/* Trip Cards */}
      {filteredTrips.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
            <path d="M3 17l2-4h14l2 4" /><path d="M5 17v2h14v-2" /><path d="M7 13l1-5h8l1 5" />
          </svg>
          <p>No trips found. Dispatch your first trip above.</p>
        </div>
      ) : (
        <div className="trips-grid">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <div className="trip-card-header">
                <div className="route-info">
                  <span className="route-source">{trip.source}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="route-arrow">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="route-dest">{trip.destination}</span>
                </div>
                <span
                  className="status-pill"
                  style={{ "--s-color": STATUS_META[trip.status]?.color || "#64748b" } as React.CSSProperties}
                >
                  {STATUS_META[trip.status]?.label || trip.status}
                </span>
              </div>

              <div className="trip-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Driver</span>
                  <span className="meta-value">{trip.driver.name}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Vehicle</span>
                  <span className="meta-value">{trip.vehicle.name} · {trip.vehicle.registrationNumber}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Cargo</span>
                  <span className="meta-value">{trip.cargoWeight} kg</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Distance</span>
                  <span className="meta-value">{trip.plannedDistance} km planned</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Expenses</span>
                  <span className="meta-value">{trip.expenses.length} entries · ${totalCost(trip.expenses).toFixed(2)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Started</span>
                  <span className="meta-value">
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
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Dispatch New Trip</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleDispatch} className="modal-form">
              {serverError && <div className="error-banner">{serverError}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Source / Origin</label>
                  <input type="text" placeholder="City or depot" value={source} onChange={(e) => setSource(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination</label>
                  <input type="text" placeholder="City or address" value={destination} onChange={(e) => setDestination(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo Weight (kg)</label>
                  <input type="number" placeholder="e.g. 2500" min="0" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Planned Distance (km)</label>
                  <input type="number" placeholder="e.g. 340" min="0" value={plannedDistance} onChange={(e) => setPlannedDistance(e.target.value)} className="form-input" required />
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">
                    Assign Vehicle
                    <span className="avail-badge">{availableVehicles.length} available</span>
                  </label>
                  <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="form-select" required>
                    <option value="">— Select a vehicle —</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} · {v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  {availableVehicles.length === 0 && (
                    <p className="hint-warn">No vehicles currently available</p>
                  )}
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">
                    Assign Driver
                    <span className="avail-badge">{availableDrivers.length} available</span>
                  </label>
                  <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="form-select" required>
                    <option value="">— Select a driver —</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} · {d.licenseNumber}</option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && (
                    <p className="hint-warn">No drivers currently available</p>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="cancel-btn" disabled={isPending}>Cancel</button>
                <button type="submit" className="dispatch-submit-btn" disabled={isPending || availableVehicles.length === 0 || availableDrivers.length === 0}>
                  {isPending ? <span className="spinner" /> : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Dispatch Trip
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .trips-root { display: flex; flex-direction: column; gap: 24px; }

        .trips-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .search-wrap { position: relative; flex: 1; max-width: 480px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #475569; }
        .search-input {
          width: 100%; height: 44px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding-left: 44px; padding-right: 16px;
          color: #f1f5f9; font-family: inherit; font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input:focus {
          outline: none; border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .dispatch-btn {
          height: 44px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          border: none; border-radius: 10px; color: #fff;
          font-size: 14px; font-weight: 600; padding: 0 20px;
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          box-shadow: 0 4px 16px rgba(59,130,246,0.25);
          transition: transform 0.15s, opacity 0.2s;
        }
        .dispatch-btn:hover { opacity: 0.95; transform: translateY(-1px); }

        /* Stats */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .stat-card {
          background: rgba(15,15,25,0.75);
          border: 1px solid rgba(255,255,255,0.05);
          border-left: 3px solid var(--s-color);
          border-radius: 12px; padding: 16px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .stat-count { font-size: 26px; font-weight: 800; color: var(--s-color); }
        .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }

        /* Empty */
        .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 16px; padding: 80px 20px; color: #475569;
          background: rgba(15,15,25,0.5); border: 1px dashed rgba(255,255,255,0.06);
          border-radius: 16px; text-align: center;
        }
        .empty-state p { font-size: 14px; }

        /* Trip grid */
        .trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 16px; }
        .trip-card {
          background: rgba(15,15,25,0.75);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px; padding: 20px 24px;
          display: flex; flex-direction: column; gap: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transition: transform 0.2s, border-color 0.2s;
        }
        .trip-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.1); }

        .trip-card-header {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .route-info { display: flex; align-items: center; gap: 8px; }
        .route-source, .route-dest { font-size: 15px; font-weight: 700; color: #f1f5f9; }
        .route-arrow { color: #475569; flex-shrink: 0; }
        .status-pill {
          font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
          padding: 3px 10px; border-radius: 20px;
          background: rgba(var(--s-color), 0.12);
          border: 1px solid var(--s-color); color: var(--s-color);
          white-space: nowrap; text-transform: uppercase;
        }

        .trip-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
        .meta-item { display: flex; flex-direction: column; gap: 2px; }
        .meta-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; }
        .meta-value { font-size: 13px; color: #94a3b8; }

        /* Modal */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; z-index: 50;
        }
        .modal-content {
          width: 100%; max-width: 580px;
          background: #0d0d1a; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; box-shadow: 0 24px 60px rgba(0,0,0,0.7);
          animation: scaleUp 0.2s ease;
        }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 26px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .modal-title { font-size: 17px; font-weight: 700; color: #f1f5f9; }
        .close-btn {
          background: none; border: none; color: #475569; cursor: pointer;
          padding: 4px; border-radius: 6px; display: flex; transition: color 0.2s;
        }
        .close-btn:hover { color: #94a3b8; }

        .modal-form { padding: 26px; display: flex; flex-direction: column; gap: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 7px; }
        .col-span-2 { grid-column: span 2; }
        .form-label {
          font-size: 12px; font-weight: 600; color: #64748b;
          display: flex; align-items: center; gap: 8px;
        }
        .avail-badge {
          font-size: 10px; background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.3); color: #10b981;
          padding: 2px 8px; border-radius: 20px;
        }
        .form-input, .form-select {
          height: 42px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 0 12px;
          color: #f1f5f9; font-family: inherit; font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-select option { background: #0d0d1a; color: #cbd5e1; }
        .form-input:focus, .form-select:focus {
          outline: none; border-color: rgba(99,102,241,0.5);
        }
        .hint-warn { font-size: 11px; color: #f59e0b; margin-top: 2px; }
        .error-banner {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #f87171;
        }

        .modal-actions {
          display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;
        }
        .cancel-btn {
          height: 40px; background: transparent;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          color: #cbd5e1; font-size: 13.5px; font-weight: 600;
          padding: 0 16px; cursor: pointer; transition: background 0.2s;
        }
        .cancel-btn:hover { background: rgba(255,255,255,0.02); }
        .dispatch-submit-btn {
          height: 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          border: none; border-radius: 8px; color: #fff;
          font-size: 13.5px; font-weight: 600; padding: 0 18px;
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; transition: opacity 0.2s;
        }
        .dispatch-submit-btn:hover { opacity: 0.9; }
        .dispatch-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
