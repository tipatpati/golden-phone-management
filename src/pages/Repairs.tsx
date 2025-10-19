
import React, { useState } from "react";
import { RepairStatsCards } from "@/components/repairs/RepairStatsCards";
import { RepairSearchBar } from "@/components/repairs/RepairSearchBar";
import { RepairsList } from "@/components/repairs/RepairsList";
import { NewRepairDialog } from "@/components/repairs/NewRepairDialog";
import { useRepairs, type Repair } from "@/services";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

const Repairs = () => {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { data: repairs = [], isLoading, error } = useRepairs(activeSearchQuery);

  if (error) {
    console.error('Error loading repairs:', error);
  }

  // Ensure repairs is always an array
  const repairsArray = Array.isArray(repairs) ? repairs as Repair[] : [];

  // Convert database repairs to match the expected format
  const formattedRepairs = repairsArray.map(repair => ({
    id: repair.id, // Use the actual database UUID, not repair_number
    repairNumber: repair.repair_number, // Add repair number separately
    clientName: repair.client 
      ? (repair.client.type === 'business' 
          ? repair.client.company_name || 'Unnamed Business'
          : `${repair.client.first_name || ''} ${repair.client.last_name || ''}`.trim() || 'Unnamed Client')
      : 'Walk-in Customer',
    device: repair.device,
    imei: repair.imei || 'N/A',
    issue: repair.issue,
    technician: repair.technician?.username || 'Unassigned',
    status: repair.status as 'quoted' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled',
    dateCreated: new Date(repair.created_at!).toISOString().split('T')[0],
    estimatedCompletion: repair.estimated_completion_date 
      ? new Date(repair.estimated_completion_date).toISOString().split('T')[0]
      : 'TBD',
    cost: repair.cost,
    priority: repair.priority as 'low' | 'normal' | 'high' | 'urgent'
  }));

  // Apply status filter
  const filteredRepairs = statusFilter 
    ? formattedRepairs.filter(repair => {
        if (statusFilter === 'total') return true;
        if (statusFilter === 'in_progress') return repair.status === 'in_progress';
        if (statusFilter === 'awaiting_parts') return repair.status === 'awaiting_parts';
        if (statusFilter === 'completed_today') {
          const today = new Date().toISOString().split('T')[0];
          const completionDate = repairsArray.find(r => r.id === repair.id)?.actual_completion_date 
            ? new Date(repairsArray.find(r => r.id === repair.id)!.actual_completion_date!).toISOString().split('T')[0]
            : null;
          return completionDate === today;
        }
        return true;
      })
    : formattedRepairs;

  // Calculate stats
  const statusCounts = {
    total: repairsArray.length,
    in_progress: repairsArray.filter(r => r.status === "in_progress").length,
    awaiting_parts: repairsArray.filter(r => r.status === "awaiting_parts").length,
    completed_today: repairsArray.filter(r => {
      if (!r.actual_completion_date) return false;
      const today = new Date().toISOString().split('T')[0];
      const completionDate = new Date(r.actual_completion_date).toISOString().split('T')[0];
      return completionDate === today;
    }).length
  };

  const handleFilterChange = (filter: string | null) => {
    setStatusFilter(filter === statusFilter ? null : filter);
  };

  const handleSearch = () => {
    setActiveSearchQuery(localSearchQuery);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    setActiveSearchQuery('');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader 
          title="Gestione Riparazioni"
          subtitle="Caricamento..."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader 
        title="Gestione Riparazioni"
        subtitle="Traccia le riparazioni dei dispositivi, assegna i tecnici e gestisci i flussi di lavoro delle riparazioni."
        actions={<NewRepairDialog />}
      />

      <ModuleNavCards currentModule="repairs" />

      {/* Stats Cards */}
      <RepairStatsCards 
        statusCounts={statusCounts} 
        onFilterChange={handleFilterChange}
        currentFilter={statusFilter}
      />

      {/* Search */}
      <RepairSearchBar 
        searchTerm={localSearchQuery} 
        onSearchChange={setLocalSearchQuery}
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      {/* Repairs List */}
      <RepairsList repairs={filteredRepairs} />
    </PageLayout>
  );
};

export default Repairs;
