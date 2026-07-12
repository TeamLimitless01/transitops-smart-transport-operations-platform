"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext } from "react";
import type { SystemSettings } from "@/lib/settings";

const SystemSettingsContext = createContext<SystemSettings | null>(null);

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
  }
  return context;
}

export default function Providers({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: SystemSettings;
}) {
  const settings: SystemSettings = initialSettings || {
    currency: "INR",
    currencySymbol: "₹",
    distanceUnit: "km",
  };

  return (
    <SessionProvider>
      <SystemSettingsContext.Provider value={settings}>
        {children}
      </SystemSettingsContext.Provider>
    </SessionProvider>
  );
}

