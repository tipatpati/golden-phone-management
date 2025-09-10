import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRepairs } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

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
  
  // Type cast the data array
  const repairsArray = (allRepairs as any[]) || [];

  // Set up real-time subscription with unique channel name
  useEffect(() => {
    const channel = supabase
      .channel('repair-stats-card-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, () => {
        logger.debug('Repair stats updated', {}, 'RepairStatsCards');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate real stats from data
  const today = new Date().toISOString().split('T')[0];
  
  const realStatusCounts = {
    total: repairsArray.length,
    in_progress: repairsArray.filter(repair => repair.status === 'in_progress').length,
    awaiting_parts: repairsArray.filter(repair => repair.status === 'awaiting_parts').length,
    completed_today: repairsArray.filter(repair => 
      repair.status === 'completed' && 
      repair.actual_completion_date?.startsWith(today)
    ).length,
  };

  // Use provided statusCounts if available, otherwise use calculated ones
  const stats = statusCounts || realStatusCounts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="card-glow border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <div className="text-sm text-blue-600">Riparazioni Totali</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-glow border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-900">{stats.in_progress}</div>
            <div className="text-sm text-orange-600">In Corso</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-glow border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-900">{stats.awaiting_parts}</div>
            <div className="text-sm text-yellow-600">In Attesa Pezzi</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-glow border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
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
