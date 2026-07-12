"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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
  AVAILABLE: "#10b981",
  ON_TRIP: "#3b82f6",
  IN_SHOP: "#f59e0b",
  RETIRED: "#ef4444",
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
    setRegistrationNumber("");
    setName("");
    setModel("");
    setType("TRUCK");
    setMaxLoadCapacity("");
    setOdometer("");
    setAcquisitionCost("");
    setRegion("");
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
            registrationNumber,
            name,
            model,
            type,
            maxLoadCapacity,
            odometer,
            acquisitionCost,
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
    <div className="vehicles-root">
      <div className="vehicles-header">
        <div className="search-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, reg number, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <button onClick={() => setIsModalOpen(true)} className="add-vehicle-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="vehicles-table">
            <thead>
              <tr>
                <th>Vehicle Info</th>
                <th>Reg Number</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Odometer</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="vehicle-row">
                    <td>
                      <div className="vehicle-details-cell">
                        <div className="vehicle-icon-chip">
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                            <polyline points="17 2 12 7 7 2"/>
                          </svg>
                        </div>
                        <div className="vehicle-name-model">
                          <span className="vehicle-name-lbl">{vehicle.name}</span>
                          <span className="vehicle-model-lbl">{vehicle.model}</span>
                        </div>
                      </div>
                    </td>
                    <td className="vehicle-reg-cell font-mono">{vehicle.registrationNumber}</td>
                    <td>
                      <span className="type-chip">{vehicle.type}</span>
                    </td>
                    <td className="vehicle-cap-cell">{vehicle.maxLoadCapacity} kg</td>
                    <td>
                      <span className="status-chip" style={{ "--status-color": STATUS_COLORS[vehicle.status] || "#94a3b8" } as React.CSSProperties}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="vehicle-odo-cell">{vehicle.odometer.toLocaleString()} km</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No vehicles found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content vehicle-modal">
            <div className="modal-header">
              <h3 className="modal-title">Add New Vehicle</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="close-modal-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="modal-form">
              {serverError && (
                <div className="modal-error-banner">
                  {serverError}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC-1234"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Truck Alpha"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Volvo FH16"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="form-select"
                  >
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Load Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 15000"
                    value={maxLoadCapacity}
                    onChange={(e) => setMaxLoadCapacity(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 50000"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Acquisition Cost</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 120000"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Region (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. North East"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="modal-cancel-btn"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={isPending}
                >
                  {isPending ? <span className="save-spinner" /> : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .vehicles-root {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .vehicles-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .search-wrap {
          position: relative;
          flex: 1;
          max-width: 480px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #475569;
        }
        .search-input {
          width: 100%;
          height: 44px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding-left: 44px;
          padding-right: 16px;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .add-vehicle-btn {
          height: 44px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(16,185,129,0.25);
          transition: transform 0.15s, opacity 0.2s;
        }
        .add-vehicle-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .table-card {
          background: rgba(15,15,25,0.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .vehicles-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .vehicles-table th {
          background: rgba(255,255,255,0.02);
          padding: 16px 24px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #475569;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .vehicle-row {
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.2s;
        }
        .vehicle-row:hover {
          background: rgba(255,255,255,0.01);
        }

        .vehicles-table td {
          padding: 16px 24px;
          font-size: 14px;
          color: #cbd5e1;
        }

        .vehicle-details-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vehicle-icon-chip {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
        }

        .vehicle-name-model {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .vehicle-name-lbl {
          font-weight: 600;
          color: #f1f5f9;
        }

        .vehicle-model-lbl {
          font-size: 12px;
          color: #64748b;
        }

        .vehicle-reg-cell {
          color: #94a3b8;
          font-family: monospace;
          background: rgba(255,255,255,0.05);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .type-chip {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
        }

        .status-chip {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(var(--status-color), 0.12);
          border: 1px solid var(--status-color);
          color: var(--status-color);
        }

        .empty-cell {
          text-align: center;
          padding: 48px !important;
          color: #64748b;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .modal-content.vehicle-modal {
          max-width: 600px;
        }

        .modal-content {
          width: 100%;
          background: #0f0f18;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          animation: scaleUp 0.2s ease;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .modal-title {
          font-size: 17px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .close-modal-btn {
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }
        .close-modal-btn:hover { color: #94a3b8; }

        .modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12.5px;
          font-weight: 500;
          color: #94a3b8;
        }

        .form-input, .form-select {
          height: 42px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0 12px;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 14px;
        }
        .form-select option {
          background: #0f0f18;
          color: #cbd5e1;
        }
        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: rgba(16,185,129,0.5);
        }

        .modal-error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #f87171;
          grid-column: span 2;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 12px;
        }

        .modal-cancel-btn {
          height: 40px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #cbd5e1;
          font-size: 13.5px;
          font-weight: 600;
          padding: 0 16px;
          cursor: pointer;
        }
        .modal-cancel-btn:hover { background: rgba(255,255,255,0.02); }

        .modal-save-btn {
          height: 40px;
          background: #10b981;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 13.5px;
          font-weight: 600;
          padding: 0 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-save-btn:hover { opacity: 0.95; }
        .modal-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .save-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
