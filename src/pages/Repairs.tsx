
import React, { useState } from "react";
import { RepairStatsCards } from "@/components/repairs/RepairStatsCards";
import { RepairSearchBar } from "@/components/repairs/RepairSearchBar";
import { RepairsList } from "@/components/repairs/RepairsList";
import { NewRepairDialog } from "@/components/repairs/NewRepairDialog";
import { useRepairs } from "@/services/useRepairs";

const Repairs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: repairs = [], isLoading, error } = useRepairs(searchTerm);

  if (error) {
    console.error('Error loading repairs:', error);
  }

  // Convert database repairs to match the expected format
  const formattedRepairs = repairs.map(repair => ({
    id: repair.repair_number,
    clientName: repair.client 
      ? (repair.client.type === 'business' 
          ? repair.client.company_name || 'Unnamed Business'
          : `${repair.client.first_name || ''} ${repair.client.last_name || ''}`.trim() || 'Unnamed Client')
      : 'Walk-in Customer',
    device: repair.device,
    imei: repair.imei || 'N/A',
    issue: repair.issue,
    technician: repair.technician?.username || 'Unassigned',
    status: repair.status,
    dateCreated: new Date(repair.created_at!).toISOString().split('T')[0],
    estimatedCompletion: repair.estimated_completion_date 
      ? new Date(repair.estimated_completion_date).toISOString().split('T')[0]
      : 'TBD',
    cost: repair.cost,
    priority: repair.priority
  }));

  // Calculate stats
  const statusCounts = {
    total: repairs.length,
    in_progress: repairs.filter(r => r.status === "in_progress").length,
    awaiting_parts: repairs.filter(r => r.status === "awaiting_parts").length,
    completed_today: repairs.filter(r => {
      if (!r.actual_completion_date) return false;
      const today = new Date().toISOString().split('T')[0];
      const completionDate = new Date(r.actual_completion_date).toISOString().split('T')[0];
      return completionDate === today;
    }).length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestione Riparazioni</h2>
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestione Riparazioni</h2>
          <p className="text-muted-foreground">
            Traccia le riparazioni dei dispositivi, assegna i tecnici e gestisci i flussi di lavoro delle riparazioni.
          </p>
        </div>
        <NewRepairDialog />
      </div>

      {/* Stats Cards */}
      <RepairStatsCards statusCounts={statusCounts} />

      {/* Search */}
      <RepairSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Repairs List */}
      <RepairsList repairs={formattedRepairs} />
    </div>
  );
};

export default Repairs;
