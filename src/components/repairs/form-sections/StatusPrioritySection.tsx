
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RepairFormData } from "../types";

interface StatusPrioritySectionProps {
  formData: RepairFormData;
  setFormData: (data: RepairFormData) => void;
}

export const StatusPrioritySection: React.FC<StatusPrioritySectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="status">Stato</Label>
        <Select value={formData.status} onValueChange={(value: RepairFormData['status']) => setFormData({...formData, status: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quoted">Preventivo</SelectItem>
            <SelectItem value="in_progress">In Corso</SelectItem>
            <SelectItem value="awaiting_parts">In Attesa Pezzi</SelectItem>
            <SelectItem value="completed">Completata</SelectItem>
            <SelectItem value="cancelled">Annullata</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priorità</Label>
        <Select value={formData.priority} onValueChange={(value: RepairFormData['priority']) => setFormData({...formData, priority: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Bassa</SelectItem>
            <SelectItem value="normal">Normale</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Costo (€)</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.cost}
          onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
        />
      </div>
    </div>
  );
};
