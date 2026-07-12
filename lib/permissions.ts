import fs from "fs";
import path from "path";

// Define the permissions mapping type
export type TabPermissions = Record<string, string[]>;

export const DEFAULT_PERMISSIONS: TabPermissions = {
  "Overview": ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
  "Users & Drivers": ["FLEET_MANAGER"],
  "Vehicles": ["FLEET_MANAGER"],
  "Trips": ["FLEET_MANAGER", "SAFETY_OFFICER", "DRIVER"],
  "Maintenance": ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  "Expenses": ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  "Fuel Logs": ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  "Reports": ["FLEET_MANAGER", "FINANCIAL_ANALYST", "SAFETY_OFFICER"],
  "Settings": ["FLEET_MANAGER"],
};

const getFilePath = () => {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "permissions.json");
};

export function getPermissions(): TabPermissions {
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data) as TabPermissions;

      // Ensure Settings remains locked to FLEET_MANAGER to prevent lockout
      parsed["Settings"] = ["FLEET_MANAGER"];
      return { ...DEFAULT_PERMISSIONS, ...parsed };
    }
  } catch (error) {
    console.error("Error reading permissions:", error);
  }
  return DEFAULT_PERMISSIONS;
}

export function savePermissions(permissions: TabPermissions): void {
  try {
    const filePath = getFilePath();
    // Guarantee Settings can't be modified
    permissions["Settings"] = ["FLEET_MANAGER"];
    fs.writeFileSync(filePath, JSON.stringify(permissions, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing permissions:", error);
    throw new Error("Failed to save permissions");
  }
}

export function hasAccess(role: string, tabTitle: string): boolean {
  const permissions = getPermissions();
  const allowedRoles = permissions[tabTitle];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
