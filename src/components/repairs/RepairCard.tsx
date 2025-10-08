
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/enhanced-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/enhanced-button";
import { Calendar, User, Wrench, Euro, AlertTriangle } from "lucide-react";
import { RepairDetailsDialog } from "./RepairDetailsDialog";
import { EditRepairDialog } from "./EditRepairDialog";

export type Repair = {
  id: string; // This is now the actual database UUID
  repairNumber?: string; // Add repair number as separate field
  clientName: string;
  device: string;
  imei: string;
  issue: string;
  technician: string;
  status: 'quoted' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled';
  dateCreated: string;
  estimatedCompletion: string;
  cost: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
};

interface RepairCardProps {
  repair: Repair;
}

export const RepairCard: React.FC<RepairCardProps> = ({ repair }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quoted':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'awaiting_parts':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'quoted': return 'Preventivo';
      case 'in_progress': return 'In Corso';
      case 'awaiting_parts': return 'In Attesa Pezzi';
      case 'completed': return 'Completata';
      case 'cancelled': return 'Annullata';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Bassa';
      case 'normal': return 'Normale';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  return (
    <>
      <Card variant="elevated" interactive={false}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle>{repair.repairNumber || repair.id}</CardTitle>
              <div className="flex gap-2">
                <Badge className={getStatusColor(repair.status)}>
                  {getStatusText(repair.status)}
                </Badge>
                <Badge className={getPriorityColor(repair.priority)}>
                  {getPriorityText(repair.priority)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outlined" 
                size="sm"
                onClick={() => setShowEdit(true)}
              >
                Modifica
              </Button>
              <Button 
                variant="outlined" 
                size="sm"
                onClick={() => setShowDetails(true)}
              >
                Dettagli
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Cliente:</span>
                <span>{repair.clientName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Dispositivo:</span>
                <span>{repair.device}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">IMEI:</span>
                <span className="font-mono text-xs">{repair.imei}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tecnico:</span>
                <span>{repair.technician}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Creata:</span>
                <span>{repair.dateCreated}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Completamento:</span>
                <span>{repair.estimatedCompletion}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="font-medium">Problema:</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">{repair.issue}</p>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Costo:</span>
              <span className="font-semibold text-lg">€{repair.cost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <RepairDetailsDialog
        repair={repair}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      <EditRepairDialog
        repair={repair}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </>
  );
};
