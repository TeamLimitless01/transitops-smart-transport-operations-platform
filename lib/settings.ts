import fs from "fs";
import path from "path";

export interface SystemSettings {
  currency: string;
  currencySymbol: string;
  distanceUnit: "km" | "miles";
}

export const DEFAULT_SETTINGS: SystemSettings = {
  currency: "INR",
  currencySymbol: "₹",
  distanceUnit: "km",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
};

const getFilePath = () => {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "settings.json");
};

export function getSystemSettings(): SystemSettings {
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data) as SystemSettings;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Error reading system settings:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
  try {
    const current = getSystemSettings();
    const currency = settings.currency || current.currency;
    const currencySymbol = CURRENCY_SYMBOLS[currency] || settings.currencySymbol || current.currencySymbol;
    const distanceUnit = settings.distanceUnit || current.distanceUnit;

    const updated: SystemSettings = {
      currency,
      currencySymbol,
      distanceUnit,
    };

    const filePath = getFilePath();
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (error) {
    console.error("Error writing system settings:", error);
    throw new Error("Failed to save system settings");
  }
}
