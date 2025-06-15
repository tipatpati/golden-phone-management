
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientSearchBar } from "../ClientSearchBar";
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
  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleClientSelect = (client: any) => {
    setFormData({ ...formData, client_id: client.id });
  };

  const handleClientClear = () => {
    setFormData({ ...formData, client_id: "" });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ClientSearchBar
        selectedClient={selectedClient}
        onClientSelect={handleClientSelect}
        onClientClear={handleClientClear}
      />

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
