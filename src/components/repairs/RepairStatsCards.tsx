
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface RepairStatsCardsProps {
  statusCounts: {
    total: number;
    in_progress: number;
    awaiting_parts: number;
    completed_today: number;
  };
}

export const RepairStatsCards: React.FC<RepairStatsCardsProps> = ({ statusCounts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total Repairs</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.awaiting_parts}</div>
            <div className="text-sm text-muted-foreground">Awaiting Parts</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed_today}</div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
