
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface RepairStatsCardsProps {
  statusCounts: {
    total: number;
    in_progress: number;
    awaiting_parts: number;
    completed_today: number;
  };
  onFilterChange: (filter: string | null) => void;
  currentFilter: string | null;
}

export const RepairStatsCards: React.FC<RepairStatsCardsProps> = ({ 
  statusCounts, 
  onFilterChange, 
  currentFilter 
}) => {
  const getCardStyle = (filter: string) => {
    const isActive = currentFilter === filter;
    return `cursor-pointer transition-all duration-200 hover:shadow-lg ${
      isActive ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:scale-105'
    }`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className={getCardStyle('total')} onClick={() => onFilterChange('total')}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <div className="text-sm text-muted-foreground">Riparazioni Totali</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className={getCardStyle('in_progress')} onClick={() => onFilterChange('in_progress')}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
            <div className="text-sm text-muted-foreground">In Corso</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className={getCardStyle('awaiting_parts')} onClick={() => onFilterChange('awaiting_parts')}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.awaiting_parts}</div>
            <div className="text-sm text-muted-foreground">In Attesa Pezzi</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className={getCardStyle('completed_today')} onClick={() => onFilterChange('completed_today')}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed_today}</div>
            <div className="text-sm text-muted-foreground">Completate Oggi</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
