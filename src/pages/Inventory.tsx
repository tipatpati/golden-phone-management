
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search, Package } from "lucide-react";
import { InventoryTableToolbar } from "@/components/inventory/InventoryTableToolbar";
import { InventoryTable } from "@/components/inventory/InventoryTable";

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <Button className="md:w-auto">
          <Package className="mr-2" />
          Add Product
        </Button>
      </div>
      
      <InventoryTableToolbar />
      <InventoryTable />
    </div>
  );
}
