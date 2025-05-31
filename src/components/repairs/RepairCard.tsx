
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Wrench } from "lucide-react";

export interface Repair {
  id: string;
  clientName: string;
  device: string;
  imei: string;
  issue: string;
  technician: string;
  status: string;
  dateCreated: string;
  estimatedCompletion: string;
  cost: number;
  priority: string;
}

interface RepairCardProps {
  repair: Repair;
}

export const RepairCard: React.FC<RepairCardProps> = ({ repair }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary"; 
      case "awaiting_parts": return "destructive";
      case "quoted": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "in_progress": return Wrench;
      case "awaiting_parts": return AlertCircle;
      case "quoted": return Clock;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600";
      case "high": return "text-orange-600";
      case "normal": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const StatusIcon = getStatusIcon(repair.status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Repair Info */}
          <div className="lg:col-span-3">
            <div className="font-semibold">{repair.id}</div>
            <div className="text-sm text-muted-foreground">
              Created: {repair.dateCreated}
            </div>
            <div className={`text-xs font-medium ${getPriorityColor(repair.priority)}`}>
              {repair.priority.toUpperCase()} PRIORITY
            </div>
          </div>

          {/* Client & Device */}
          <div className="lg:col-span-3">
            <div className="font-medium">{repair.clientName}</div>
            <div className="text-sm text-muted-foreground">{repair.device}</div>
            <div className="text-xs text-muted-foreground">IMEI: {repair.imei}</div>
          </div>

          {/* Issue */}
          <div className="lg:col-span-2">
            <div className="text-sm">{repair.issue}</div>
          </div>

          {/* Technician */}
          <div className="lg:col-span-1">
            <div className="text-sm font-medium">{repair.technician}</div>
          </div>

          {/* Cost */}
          <div className="lg:col-span-1">
            <div className="font-bold">${repair.cost.toFixed(2)}</div>
          </div>

          {/* Status */}
          <div className="lg:col-span-1">
            <Badge variant={getStatusColor(repair.status)} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {repair.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* ETA */}
          <div className="lg:col-span-1">
            <div className="text-sm text-center">
              <div className="font-medium">{repair.estimatedCompletion}</div>
              <div className="text-xs text-muted-foreground">ETA</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
