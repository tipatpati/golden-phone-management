import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRepairs } from "@/services/useRepairs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type RepairStatusType = "in_progress" | "awaiting_parts" | "completed" | "quoted" | "cancelled";

export function RepairStatus() {
  const { data: allRepairs = [] } = useRepairs();

  // Set up real-time subscription for repair updates with unique channel name
  useEffect(() => {
    const channel = supabase
      .channel('repair-status-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, () => {
        console.log('Repair status: Repairs data updated');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter active repairs (not completed or cancelled)
  const activeRepairs = allRepairs.filter(repair => 
    repair.status !== 'completed' && repair.status !== 'cancelled'
  ).slice(0, 5); // Show only first 5

  const getStatusColor = (status: RepairStatusType) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "awaiting_parts":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "quoted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusDisplayName = (status: RepairStatusType) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "awaiting_parts":
        return "Awaiting Parts";
      case "completed":
        return "Completed";
      case "quoted":
        return "Quoted";
      case "cancelled":
        return "Cancelled";
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
        <CardTitle className="text-base sm:text-lg">Active Repairs</CardTitle>
      </CardHeader>
      <CardContent>
        {activeRepairs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-gray-600">ID</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-gray-600">Client</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-gray-600">Device</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-gray-600">Status</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-gray-600 hidden sm:table-cell">Technician</th>
                  <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-gray-600">Due</th>
                </tr>
              </thead>
              <tbody>
                {activeRepairs.map((repair) => (
                  <tr key={repair.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 font-mono text-[10px] sm:text-xs">{repair.repair_number}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 truncate max-w-[100px] sm:max-w-none">{getClientName(repair.client)}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 truncate max-w-[80px] sm:max-w-none">{repair.device}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-[10px] sm:text-xs font-medium ${getStatusColor(
                          repair.status as RepairStatusType
                        )}`}
                      >
                        {getStatusDisplayName(repair.status as RepairStatusType)}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 hidden sm:table-cell">{getTechnicianName(repair.technician)}</td>
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4">
                      <span className={formatDueDate(repair.estimated_completion_date).includes('overdue') ? 'text-red-600 font-medium' : ''}>
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
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">No active repairs at the moment!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
