import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPermissions } from "@/lib/permissions";
import SettingsManager from "@/components/settings/SettingsManager";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Only FLEET_MANAGER role is allowed to see the settings configuration page
  if (session.user.role !== "FLEET_MANAGER") {
    redirect("/dashboard");
  }

  const permissions = getPermissions();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure security, access levels, and role-based navigation visible across TransitOps.
        </p>
      </div>
      <SettingsManager initialPermissions={JSON.parse(JSON.stringify(permissions))} />
    </div>
  );
}
