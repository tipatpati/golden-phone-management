
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Wrench, Euro, AlertTriangle, Hash } from "lucide-react";
import { type Repair } from "./RepairCard";

interface RepairDetailsDialogProps {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RepairDetailsDialog: React.FC<RepairDetailsDialogProps> = ({ 
  repair, 
  open, 
  onOpenChange 
}) => {
  if (!repair) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Dettagli Riparazione</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with ID and Status */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-semibold">{repair.id}</span>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(repair.status)}>
                {getStatusText(repair.status)}
              </Badge>
              <Badge className={getPriorityColor(repair.priority)}>
                {getPriorityText(repair.priority)}
              </Badge>
            </div>
          </div>

          {/* Client and Device Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Informazioni Cliente</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Nome:</span>
                  <span>{repair.clientName}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Informazioni Dispositivo</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Dispositivo:</span>
                  <span>{repair.device}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">IMEI:</span>
                  <span className="font-mono text-sm">{repair.imei}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technician and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Assegnazione</h3>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tecnico:</span>
                <span>{repair.technician}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Timeline</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Creata:</span>
                  <span>{repair.dateCreated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Completamento:</span>
                  <span>{repair.estimatedCompletion}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Descrizione Problema</h3>
            </div>
            <p className="text-muted-foreground bg-muted p-4 rounded-lg">{repair.issue}</p>
          </div>

          {/* Cost Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Informazioni Costo</h3>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Costo Totale:</span>
                <span className="text-2xl font-bold">€{repair.cost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
