
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RepairStatsCards } from "@/components/repairs/RepairStatsCards";
import { RepairSearchBar } from "@/components/repairs/RepairSearchBar";
import { RepairsList } from "@/components/repairs/RepairsList";
import type { Repair } from "@/components/repairs/RepairCard";

const Repairs = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock repair data
  const repairs: Repair[] = [
    {
      id: "REP-001",
      clientName: "John Doe",
      device: "iPhone 13 Pro",
      imei: "352908764123456",
      issue: "Cracked screen replacement",
      technician: "Mike Johnson",
      status: "in_progress",
      dateCreated: "2024-01-12",
      estimatedCompletion: "2024-01-16",
      cost: 280.00,
      priority: "normal"
    },
    {
      id: "REP-002", 
      clientName: "Tech Solutions Inc.",
      device: "Samsung Galaxy S22",
      imei: "990000862471854",
      issue: "Battery replacement + charging port cleaning",
      technician: "Sarah Wilson",
      status: "awaiting_parts",
      dateCreated: "2024-01-10",
      estimatedCompletion: "2024-01-18",
      cost: 150.00,
      priority: "high"
    },
    {
      id: "REP-003",
      clientName: "Maria Garcia", 
      device: "iPhone 12",
      imei: "352908764123789",
      issue: "Water damage assessment and repair",
      technician: "Mike Johnson",
      status: "completed",
      dateCreated: "2024-01-08",
      estimatedCompletion: "2024-01-15",
      cost: 320.00,
      priority: "urgent"
    },
    {
      id: "REP-004",
      clientName: "David Kim",
      device: "iPad Air",
      imei: "352908764123999",
      issue: "Screen and digitizer replacement",
      technician: "Sarah Wilson", 
      status: "quoted",
      dateCreated: "2024-01-14",
      estimatedCompletion: "2024-01-20",
      cost: 450.00,
      priority: "normal"
    }
  ];

  const filteredRepairs = repairs.filter(repair => 
    repair.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.imei.includes(searchTerm)
  );

  // Stats
  const statusCounts = {
    total: repairs.length,
    in_progress: repairs.filter(r => r.status === "in_progress").length,
    awaiting_parts: repairs.filter(r => r.status === "awaiting_parts").length,
    completed_today: repairs.filter(r => r.status === "completed" && r.estimatedCompletion === "2024-01-15").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repair Management</h2>
          <p className="text-muted-foreground">
            Track device repairs, assign technicians, and manage repair workflows.
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Repair
        </Button>
      </div>

      {/* Stats Cards */}
      <RepairStatsCards statusCounts={statusCounts} />

      {/* Search */}
      <RepairSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Repairs List */}
      <RepairsList repairs={filteredRepairs} />
    </div>
  );
};

export default Repairs;
