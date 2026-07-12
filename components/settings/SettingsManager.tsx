"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, ShieldAlert, Check, Loader2, Info, Droplets } from "lucide-react";
import { useSystemSettings } from "@/app/providers";

interface SettingsManagerProps {
  initialPermissions: Record<string, string[]>;
}

const TABS = [
  "Overview",
  "Users & Drivers",
  "Vehicles",
  "Trips",
  "Maintenance",
  "Expenses",
  "Fuel Logs",
  "Reports",
  "Settings"
];

const ROLES = [
  { key: "FLEET_MANAGER", label: "Fleet Manager" },
  { key: "DRIVER", label: "Driver" },
  { key: "SAFETY_OFFICER", label: "Safety Officer" },
  { key: "FINANCIAL_ANALYST", label: "Financial Analyst" }
];

export default function SettingsManager({ initialPermissions }: SettingsManagerProps) {
  const router = useRouter();
  const systemSettings = useSystemSettings();

  const [permissions, setPermissions] = useState<Record<string, string[]>>(initialPermissions);
  const [currency, setCurrency] = useState(systemSettings.currency);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "miles">(systemSettings.distanceUnit);

  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckboxChange = (tab: string, role: string) => {
    if (tab === "Settings") return;

    setPermissions((prev) => {
      const currentRoles = prev[tab] || [];
      let updatedRoles: string[];

      if (currentRoles.includes(role)) {
        if (role === "FLEET_MANAGER" && (tab === "Overview" || tab === "Users & Drivers")) {
          return prev;
        }
        updatedRoles = currentRoles.filter((r) => r !== role);
      } else {
        updatedRoles = [...currentRoles, role];
      }

      return {
        ...prev,
        [tab]: updatedRoles,
      };
    });
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissions,
            settings: {
              currency,
              distanceUnit,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save settings");
          return;
        }

        setSaveSuccess(true);
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setError("Network error. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* General System Settings Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="bg-indigo-600/10 p-2 rounded-lg">
            <Settings size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">General Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize currency symbol and preferred measurement units for the platform.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="CAD">CAD (C$) - Canadian Dollar</option>
              <option value="AUD">AUD (A$) - Australian Dollar</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Distance Unit</label>
            <select
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value as "km" | "miles")}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="km">Kilometers (km)</option>
              <option value="miles">Miles (mi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="bg-indigo-600/10 p-2 rounded-lg">
            <Settings size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Tab Access Permissions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Control which navigation links and pages are visible and accessible to each system role.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
            <Check size={18} />
            System settings updated successfully!
          </div>
        )}

        <div className="bg-slate-950 border border-slate-800/60 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Navigation Tab</th>
                {ROLES.map((role) => (
                  <th key={role.key} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {TABS.map((tab) => (
                <tr key={tab} className="hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                    {tab}
                    {tab === "Settings" && (
                      <span className="ml-2 bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-normal">
                        System Locked
                      </span>
                    )}
                  </td>
                  {ROLES.map((role) => {
                    const isChecked = (permissions[tab] || []).includes(role.key);
                    const isReadOnly = tab === "Settings";

                    return (
                      <td key={role.key} className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isReadOnly}
                          onChange={() => handleCheckboxChange(tab, role.key)}
                          className={`h-4.5 w-4.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 transition-all ${
                            isReadOnly ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info size={14} className="text-slate-400" />
            <span>Settings tab is locked to Fleet Manager to prevent accidental layout locks.</span>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
