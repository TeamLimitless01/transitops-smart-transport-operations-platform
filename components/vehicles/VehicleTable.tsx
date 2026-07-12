"use client";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

const vehicles = [
  {
    id: 1,
    registrationNumber: "GJ01AB1234",
    name: "Truck 1",
    type: "TRUCK",
    status: "AVAILABLE",
    region: "North",
  },
  {
    id: 2,
    registrationNumber: "GJ01CD5678",
    name: "Van 1",
    type: "VAN",
    status: "ON_TRIP",
    region: "West",
  },
];

export default function VehicleTable() {
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Registration</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Region</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>{vehicle.registrationNumber}</TableCell>

              <TableCell>{vehicle.name}</TableCell>

              <TableCell>{vehicle.type}</TableCell>

              <TableCell>
                <Badge>{vehicle.status}</Badge>
              </TableCell>

              <TableCell>{vehicle.region}</TableCell>

              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button size="icon" variant="destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}