"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:      { label: "Draft",      color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  DISPATCHED: { label: "On Trip",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  COMPLETED:  { label: "Completed",  color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  CANCELLED:  { label: "Cancelled",  color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const EXPENSE_TYPES = ["FUEL", "MAINTENANCE", "TOLL", "PARKING", "OTHER"];

export default function DriverDashboard({ driverName, trips }: DriverDashboardProps) {
  const router = useRouter();
  const [allTrips, setAllTrips] = useState<Trip[]>(trips);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

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

  const handleCompleteTrip = async (tripId: string) => {
    if (!confirm("Mark this trip as completed?")) return;
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) { alert("Failed to complete trip"); return; }
      const updatedTrip = await res.json();
      setAllTrips(allTrips.map((t) => t.id === tripId ? updatedTrip : t));
      if (selectedTrip?.id === tripId) setSelectedTrip(updatedTrip);
      router.refresh();
    } catch {
      alert("Network error.");
    }
  };

  const totalExpenses = (expenses: Expense[]) => expenses.reduce((s, e) => s + e.cost, 0);

  return (
    <div className="dd-root">
      {/* Greeting */}
      <div className="dd-greeting">
        <div>
          <h1 className="dd-title">Welcome back, {driverName} 👋</h1>
          <p className="dd-subtitle">Here's your trip overview for today</p>
        </div>
        <div className="dd-stats">
          <div className="dd-stat">
            <span className="dd-stat-val">{allTrips.length}</span>
            <span className="dd-stat-label">Total Trips</span>
          </div>
          <div className="dd-stat">
            <span className="dd-stat-val">{pastTrips.filter(t => t.status === "COMPLETED").length}</span>
            <span className="dd-stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="dd-layout">
        {/* Left column: Active + History */}
        <div className="dd-left">
          {/* Active Trip */}
          {activeTrip ? (
            <div className="section-block">
              <h2 className="section-title">
                <span className="live-dot" /> Current Trip
              </h2>
              <div className="active-trip-card" onClick={() => openTripDetail(activeTrip)}>
                <div className="atp-header">
                  <div className="atp-route">
                    <span className="atp-city">{activeTrip.source}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span className="atp-city">{activeTrip.destination}</span>
                  </div>
                  <span className="atp-status-pill">LIVE</span>
                </div>
                <div className="atp-meta">
                  <div className="atp-meta-item">
                    <span className="atp-meta-label">Vehicle</span>
                    <span className="atp-meta-val">{activeTrip.vehicle.name} · {activeTrip.vehicle.registrationNumber}</span>
                  </div>
                  <div className="atp-meta-item">
                    <span className="atp-meta-label">Cargo</span>
                    <span className="atp-meta-val">{activeTrip.cargoWeight} kg</span>
                  </div>
                  <div className="atp-meta-item">
                    <span className="atp-meta-label">Distance</span>
                    <span className="atp-meta-val">{activeTrip.plannedDistance} km</span>
                  </div>
                  <div className="atp-meta-item">
                    <span className="atp-meta-label">Expenses</span>
                    <span className="atp-meta-val">{activeTrip.expenses.length} · ${totalExpenses(activeTrip.expenses).toFixed(2)}</span>
                  </div>
                </div>
                <p className="atp-click-hint">Click to log expenses or complete trip →</p>
              </div>
            </div>
          ) : (
            <div className="no-active-trip">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <p>No active trip. You're currently off duty.</p>
            </div>
          )}

          {/* Trip History */}
          {pastTrips.length > 0 && (
            <div className="section-block">
              <h2 className="section-title">Trip History</h2>
              <div className="history-list">
                {pastTrips.map((trip) => (
                  <div key={trip.id} className="history-item" onClick={() => openTripDetail(trip)}>
                    <div className="hi-route">
                      <span className="hi-city">{trip.source}</span>
                      <span className="hi-sep">→</span>
                      <span className="hi-city">{trip.destination}</span>
                    </div>
                    <div className="hi-meta">
                      <span>{new Date(trip.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>{trip.expenses.length} expenses</span>
                      <span
                        className="hi-status"
                        style={{ color: STATUS_META[trip.status]?.color }}
                      >
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
        <div className="dd-right">
          {selectedTrip ? (
            <div className="detail-panel">
              <div className="dp-header">
                <div>
                  <h3 className="dp-route">{selectedTrip.source} → {selectedTrip.destination}</h3>
                  <span
                    className="dp-status-pill"
                    style={{
                      color: STATUS_META[selectedTrip.status]?.color,
                      background: STATUS_META[selectedTrip.status]?.bg,
                    }}
                  >
                    {STATUS_META[selectedTrip.status]?.label}
                  </span>
                </div>
              </div>

              <div className="dp-info-grid">
                <div className="dp-info-item"><span className="dp-info-label">Vehicle</span><span className="dp-info-val">{selectedTrip.vehicle.name}</span></div>
                <div className="dp-info-item"><span className="dp-info-label">Reg #</span><span className="dp-info-val">{selectedTrip.vehicle.registrationNumber}</span></div>
                <div className="dp-info-item"><span className="dp-info-label">Cargo Weight</span><span className="dp-info-val">{selectedTrip.cargoWeight} kg</span></div>
                <div className="dp-info-item"><span className="dp-info-label">Planned Dist.</span><span className="dp-info-val">{selectedTrip.plannedDistance} km</span></div>
                <div className="dp-info-item"><span className="dp-info-label">Actual Dist.</span><span className="dp-info-val">{selectedTrip.actualDistance ?? "—"} km</span></div>
                <div className="dp-info-item"><span className="dp-info-label">Fuel Used</span><span className="dp-info-val">{selectedTrip.fuelConsumed ?? "—"} L</span></div>
              </div>

              {/* Expenses */}
              <div className="dp-expenses-header">
                <span className="dp-section-title">Expenses</span>
                {selectedTrip.status === "DISPATCHED" && (
                  <button className="add-expense-btn" onClick={() => setExpenseModalOpen(true)}>
                    + Add Expense
                  </button>
                )}
              </div>

              {selectedTrip.expenses.length === 0 ? (
                <p className="dp-empty">No expenses logged yet.</p>
              ) : (
                <div className="dp-expense-list">
                  {selectedTrip.expenses.map((exp) => (
                    <div key={exp.id} className="dp-expense-item">
                      <div className="dpe-left">
                        <span className="dpe-type">{exp.type}</span>
                        {exp.description && <span className="dpe-desc">{exp.description}</span>}
                        <span className="dpe-date">{new Date(exp.date).toLocaleDateString()}</span>
                      </div>
                      <div className="dpe-right">
                        {exp.type === "FUEL" && exp.liters > 0 && (
                          <span className="dpe-liters">{exp.liters}L</span>
                        )}
                        <span className="dpe-cost">${exp.cost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="dp-expense-total">
                    <span>Total</span>
                    <span>${totalExpenses(selectedTrip.expenses).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {selectedTrip.status === "DISPATCHED" && (
                <button
                  className="complete-trip-btn"
                  onClick={() => handleCompleteTrip(selectedTrip.id)}
                >
                  ✓ Mark as Completed
                </button>
              )}
            </div>
          ) : (
            <div className="detail-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
              </svg>
              <p>Select a trip to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Expense Modal */}
      {expenseModalOpen && selectedTrip && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Log Expense</h3>
              <button className="close-btn" onClick={() => { setExpenseModalOpen(false); resetExpForm(); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="modal-form">
              {serverError && <div className="error-banner">{serverError}</div>}

              <div className="form-group">
                <label className="form-label">Expense Type</label>
                <select value={expType} onChange={(e) => setExpType(e.target.value)} className="form-select">
                  {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {expType === "FUEL" && (
                <div className="form-group">
                  <label className="form-label">Liters</label>
                  <input type="number" min="0" step="0.01" placeholder="e.g. 45.5" value={expLiters} onChange={(e) => setExpLiters(e.target.value)} className="form-input" />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input type="number" min="0" step="0.01" placeholder="e.g. 78.50" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="form-input" required />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="form-input" required />
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input type="text" placeholder="e.g. Fuel at Shell station" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} className="form-input" />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => { setExpenseModalOpen(false); resetExpForm(); }} disabled={isPending}>Cancel</button>
                <button type="submit" className="save-btn" disabled={isPending}>
                  {isPending ? <span className="spinner" /> : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .dd-root { display: flex; flex-direction: column; gap: 28px; padding: 32px; max-width: 1400px; margin: 0 auto; }

        .dd-greeting {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(15,15,25,0.7); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 24px 28px;
        }
        .dd-title { font-size: 22px; font-weight: 800; color: #f1f5f9; margin: 0; }
        .dd-subtitle { font-size: 13px; color: #475569; margin: 6px 0 0; }
        .dd-stats { display: flex; gap: 32px; }
        .dd-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .dd-stat-val { font-size: 28px; font-weight: 800; color: #6366f1; }
        .dd-stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 0.4px; }

        .dd-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
        .dd-left { display: flex; flex-direction: column; gap: 20px; }
        .dd-right { position: sticky; top: 24px; height: fit-content; }

        .section-block { display: flex; flex-direction: column; gap: 12px; }
        .section-title {
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: #475569;
          display: flex; align-items: center; gap: 8px;
        }
        .live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.05); } }

        .active-trip-card {
          background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.2);
          border-radius: 16px; padding: 20px 24px; cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          display: flex; flex-direction: column; gap: 14px;
        }
        .active-trip-card:hover { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.35); }

        .atp-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .atp-route { display: flex; align-items: center; gap: 10px; }
        .atp-city { font-size: 18px; font-weight: 800; color: #f1f5f9; }
        .atp-status-pill {
          font-size: 10px; font-weight: 800; letter-spacing: 1px;
          background: #3b82f6; color: #fff; padding: 3px 10px; border-radius: 20px;
          animation: pulse-blue 2s ease-in-out infinite;
        }
        @keyframes pulse-blue { 0%,100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.2); } 50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.05); } }

        .atp-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
        .atp-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .atp-meta-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #64748b; }
        .atp-meta-val { font-size: 13px; color: #94a3b8; }
        .atp-click-hint { font-size: 11px; color: #3b82f6; margin: 0; }

        .no-active-trip {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; padding: 36px; color: #475569;
          background: rgba(15,15,25,0.4); border: 1px dashed rgba(255,255,255,0.06);
          border-radius: 16px; text-align: center;
        }
        .no-active-trip p { font-size: 13px; margin: 0; }

        .history-list { display: flex; flex-direction: column; gap: 8px; }
        .history-item {
          background: rgba(15,15,25,0.6); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 12px 16px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          cursor: pointer; transition: background 0.15s, border-color 0.15s;
        }
        .history-item:hover { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); }
        .hi-route { display: flex; align-items: center; gap: 6px; }
        .hi-city { font-size: 13px; font-weight: 600; color: #cbd5e1; }
        .hi-sep { color: #475569; font-size: 11px; }
        .hi-meta { display: flex; gap: 12px; align-items: center; font-size: 11px; color: #64748b; }
        .hi-status { font-weight: 700; }

        /* Detail panel */
        .detail-panel {
          background: rgba(15,15,25,0.8); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 16px;
        }
        .dp-header { display: flex; flex-direction: column; gap: 8px; }
        .dp-route { font-size: 16px; font-weight: 800; color: #f1f5f9; margin: 0; }
        .dp-status-pill {
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 20px; width: fit-content;
        }

        .dp-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
        .dp-info-item { display: flex; flex-direction: column; gap: 2px; }
        .dp-info-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; }
        .dp-info-val { font-size: 13px; color: #94a3b8; }

        .dp-expenses-header {
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px;
        }
        .dp-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }
        .add-expense-btn {
          height: 30px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
          border-radius: 8px; color: #818cf8; font-size: 12px; font-weight: 600;
          padding: 0 12px; cursor: pointer; transition: background 0.2s;
        }
        .add-expense-btn:hover { background: rgba(99,102,241,0.25); }

        .dp-empty { font-size: 12px; color: #475569; text-align: center; padding: 20px 0; margin: 0; }
        .dp-expense-list { display: flex; flex-direction: column; gap: 6px; }
        .dp-expense-item {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px; padding: 9px 12px; gap: 12px;
        }
        .dpe-left { display: flex; flex-direction: column; gap: 2px; }
        .dpe-type { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
        .dpe-desc { font-size: 11px; color: #64748b; }
        .dpe-date { font-size: 10px; color: #475569; }
        .dpe-right { display: flex; align-items: center; gap: 10px; }
        .dpe-liters { font-size: 11px; color: #64748b; }
        .dpe-cost { font-size: 14px; font-weight: 700; color: #10b981; }
        .dp-expense-total {
          display: flex; justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;
          font-size: 13px; font-weight: 700; color: #f1f5f9;
        }

        .complete-trip-btn {
          width: 100%; height: 40px; background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.3); border-radius: 10px;
          color: #10b981; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: background 0.2s;
        }
        .complete-trip-btn:hover { background: rgba(16,185,129,0.2); }

        .detail-placeholder {
          height: 300px; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 12px; color: #475569;
          background: rgba(15,15,25,0.5); border: 1px dashed rgba(255,255,255,0.06);
          border-radius: 16px; text-align: center;
        }
        .detail-placeholder p { font-size: 13px; margin: 0; }

        /* Modal */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; z-index: 100;
        }
        .modal-content {
          width: 100%; max-width: 440px; background: #0d0d1a;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 18px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.7); animation: scaleUp 0.2s ease;
        }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .modal-title { font-size: 16px; font-weight: 700; color: #f1f5f9; margin: 0; }
        .close-btn {
          background: none; border: none; color: #475569; cursor: pointer;
          padding: 4px; border-radius: 6px; display: flex; transition: color 0.2s;
        }
        .close-btn:hover { color: #94a3b8; }

        .modal-form { padding: 22px; display: flex; flex-direction: column; gap: 14px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12px; font-weight: 600; color: #64748b; }
        .form-input, .form-select {
          height: 40px; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          padding: 0 12px; color: #f1f5f9; font-family: inherit; font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-select option { background: #0d0d1a; color: #cbd5e1; }
        .form-input:focus, .form-select:focus {
          outline: none; border-color: rgba(99,102,241,0.5);
        }
        .error-banner {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #f87171;
        }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
        .cancel-btn {
          height: 38px; background: transparent;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          color: #cbd5e1; font-size: 13px; font-weight: 600; padding: 0 14px; cursor: pointer;
        }
        .cancel-btn:hover { background: rgba(255,255,255,0.02); }
        .save-btn {
          height: 38px; background: #6366f1; border: none; border-radius: 8px;
          color: #fff; font-size: 13px; font-weight: 600; padding: 0 16px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: opacity 0.2s;
        }
        .save-btn:hover { opacity: 0.9; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
