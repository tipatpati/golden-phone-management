
import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRepairs } from "@/services/useRepairs";
import { supabase } from "@/integrations/supabase/client";

interface RepairStatsCardsProps {
  statusCounts?: {
    total: number;
    in_progress: number;
    awaiting_parts: number;
    completed_today: number;
  };
}

export const RepairStatsCards: React.FC<RepairStatsCardsProps> = ({ statusCounts }) => {
  const { data: allRepairs = [] } = useRepairs();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('repair-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, () => {
        console.log('Repair stats updated');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate real stats from data
  const today = new Date().toISOString().split('T')[0];
  
  const realStatusCounts = {
    total: allRepairs.length,
    in_progress: allRepairs.filter(repair => repair.status === 'in_progress').length,
    awaiting_parts: allRepairs.filter(repair => repair.status === 'awaiting_parts').length,
    completed_today: allRepairs.filter(repair => 
      repair.status === 'completed' && 
      repair.actual_completion_date?.startsWith(today)
    ).length,
  };

  // Use provided statusCounts if available, otherwise use calculated ones
  const stats = statusCounts || realStatusCounts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <div className="text-sm text-blue-600">Riparazioni Totali</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-900">{stats.in_progress}</div>
            <div className="text-sm text-orange-600">In Corso</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-900">{stats.awaiting_parts}</div>
            <div className="text-sm text-yellow-600">In Attesa Pezzi</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">{stats.completed_today}</div>
            <div className="text-sm text-green-600">Completate Oggi</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
