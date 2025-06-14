
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RepairFormData } from "../types";

interface ClientTechnicianSectionProps {
  formData: RepairFormData;
  setFormData: (data: RepairFormData) => void;
  clients: any[];
  technicians: any[];
  getClientDisplayName: (client: any) => string;
}

export const ClientTechnicianSection: React.FC<ClientTechnicianSectionProps> = ({
  formData,
  setFormData,
  clients,
  technicians,
  getClientDisplayName
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="client">Cliente</Label>
        <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {getClientDisplayName(client)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="technician">Tecnico</Label>
        <Select value={formData.technician_id} onValueChange={(value) => setFormData({...formData, technician_id: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Assegna tecnico" />
          </SelectTrigger>
          <SelectContent>
            {technicians.map((tech) => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.username || 'Unnamed Technician'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
