import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import VehicleTable from "@/components/vehicles/VehicleTable";

export default function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your fleet vehicles.
          </p>
        </div>

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <VehicleTable />
    </div>
  );
}