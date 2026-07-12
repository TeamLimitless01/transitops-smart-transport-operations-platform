"use client";

import { FileDown, Printer } from "lucide-react";

interface Expense {
  cost: number;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  status: string;
  driver: { name: string };
  vehicle: { name: string; registrationNumber: string };
  expenses: Expense[];
}

interface ReportsExportProps {
  trips: Trip[];
}

export default function ReportsExport({ trips }: ReportsExportProps) {
  const exportCSV = () => {
    const headers = [
      "Trip ID",
      "Source",
      "Destination",
      "Driver",
      "Vehicle",
      "Registration Number",
      "Cargo Weight (kg)",
      "Planned Distance (km)",
      "Actual Distance (km)",
      "Status",
      "Total Expenses ($)",
    ];

    const rows = trips.map((t) => [
      t.id,
      `"${t.source.replace(/"/g, '""')}"`,
      `"${t.destination.replace(/"/g, '""')}"`,
      `"${t.driver.name.replace(/"/g, '""')}"`,
      `"${t.vehicle.name.replace(/"/g, '""')}"`,
      t.vehicle.registrationNumber,
      t.cargoWeight,
      t.plannedDistance,
      t.actualDistance || "",
      t.status,
      t.expenses.reduce((s, e) => s + e.cost, 0).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_operations_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportCSV}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-700/50 transition-colors shadow-lg"
      >
        <FileDown size={14} /> Export CSV
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2.5 rounded-xl border border-indigo-500/20 transition-colors shadow-lg"
      >
        <Printer size={14} /> Print Report
      </button>
    </div>
  );
}
