import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRepairs } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { logger } from "@/utils/logger";
import { StatusBadge } from "@/components/ui/status-badge";

type RepairStatusType = "in_progress" | "awaiting_parts" | "completed" | "quoted" | "cancelled";

export function RepairStatus() {
  const { data: allRepairs = [] } = useRepairs();
  
  // Type cast the data array
  const repairsArray = (allRepairs as any[]) || [];

  // Set up real-time subscription for repair updates with unique channel name
  useEffect(() => {
    const channel = supabase
      .channel('repair-status-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, () => {
        logger.debug('Repairs data updated', {}, 'RepairStatus');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter active repairs (not completed or cancelled)
  const activeRepairs = repairsArray.filter(repair => 
    repair.status !== 'completed' && repair.status !== 'cancelled'
  ).slice(0, 5); // Show only first 5

  const getStatusBadgeType = (status: RepairStatusType): "info" | "warning" | "success" | "default" | "inactive" => {
    switch (status) {
      case "in_progress":
        return "info";
      case "awaiting_parts":
        return "warning";
      case "completed":
        return "success";
      case "quoted":
        return "default";
      case "cancelled":
        return "inactive";
      default:
        return "default";
    }
  };

  const getStatusDisplayName = (status: RepairStatusType) => {
    switch (status) {
      case "in_progress":
        return "In Corso";
      case "awaiting_parts":
        return "In Attesa Pezzi";
      case "completed":
        return "Completata";
      case "quoted":
        return "Preventivo";
      case "cancelled":
        return "Annullata";
      default:
        return status;
    }
  };

  const getClientName = (client: any) => {
    if (!client) return "Walk-in Customer";
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const getTechnicianName = (technician: any) => {
    return technician?.username || "Unassigned";
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return "Not set";
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return format(dueDate, "MMM dd");
  };

  return (
    <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Riparazioni Attive</CardTitle>
      </CardHeader>
      <CardContent>
        {activeRepairs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-muted-foreground">ID</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-muted-foreground">Client</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-muted-foreground">Device</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-muted-foreground hidden sm:table-cell">Technician</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-muted-foreground">Due</th>
                </tr>
              </thead>
              <tbody>
                {activeRepairs.map((repair) => (
                  <tr key={repair.id} className="border-b border-border last:border-0 hover:bg-surface-container-low">
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 font-mono text-[10px] sm:text-xs">{repair.repair_number}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 truncate max-w-[100px] sm:max-w-none">{getClientName(repair.client)}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 truncate max-w-[80px] sm:max-w-none">{repair.device}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4">
                      <StatusBadge status={getStatusBadgeType(repair.status as RepairStatusType)} size="sm">
                        {getStatusDisplayName(repair.status as RepairStatusType)}
                      </StatusBadge>
                    </td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 hidden sm:table-cell">{getTechnicianName(repair.technician)}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4">
                      <span className={formatDueDate(repair.estimated_completion_date).includes('overdue') ? 'text-destructive font-medium' : ''}>
                        {formatDueDate(repair.estimated_completion_date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-success-container rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Nessuna riparazione attiva al momento!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
