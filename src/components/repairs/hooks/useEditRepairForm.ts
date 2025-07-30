
import { useState, useEffect } from "react";
import { useUpdateRepair, useTechnicians } from "@/services";
import { useClients } from "@/services";
import { type Repair } from "../RepairCard";
import { type RepairFormData } from "../types";

export const useEditRepairForm = (repair: Repair | null, open: boolean, onOpenChange: (open: boolean) => void) => {
  const [formData, setFormData] = useState<RepairFormData>({
    client_id: "",
    technician_id: "",
    device: "",
    imei: "",
    issue: "",
    status: "quoted",
    priority: "normal",
    estimated_completion_date: "",
    cost: 0,
    notes: ""
  });

  const updateRepair = useUpdateRepair();
  const { data: clientsData = [] } = useClients();
  const { data: techniciansData = [] } = useTechnicians();
  
  // Type-safe array handling
  const clients = Array.isArray(clientsData) ? clientsData : [];
  const technicians = Array.isArray(techniciansData) ? techniciansData : [];

  useEffect(() => {
    if (repair && open) {
      // Find client ID by name
      const client = clients.find(c => {
        const clientName = c.type === 'business' 
          ? c.company_name || 'Unnamed Business'
          : `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed Client';
        return clientName === repair.clientName;
      });

      // Find technician ID by username
      const technician = technicians.find(t => t.username === repair.technician);

      setFormData({
        client_id: client?.id || "",
        technician_id: technician?.id || "",
        device: repair.device,
        imei: repair.imei || "",
        issue: repair.issue,
        status: repair.status,
        priority: repair.priority,
        estimated_completion_date: repair.estimatedCompletion !== 'TBD' ? repair.estimatedCompletion : "",
        cost: repair.cost,
        notes: ""
      });
    }
  }, [repair, open, clients, technicians]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repair) return;
    
    try {
      await updateRepair.mutateAsync({
        id: repair.id,
        data: {
          client_id: formData.client_id || undefined,
          technician_id: formData.technician_id || undefined,
          device: formData.device,
          imei: formData.imei || undefined,
          issue: formData.issue,
          status: formData.status,
          priority: formData.priority,
          estimated_completion_date: formData.estimated_completion_date || undefined,
          cost: formData.cost,
          notes: formData.notes || undefined,
        }
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating repair:', error);
    }
  };

  const getClientDisplayName = (client: any) => {
    if (client.type === 'business') {
      return client.company_name || 'Unnamed Business';
    }
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed Client';
  };

  return {
    formData,
    setFormData,
    clients,
    technicians,
    updateRepair,
    handleSubmit,
    getClientDisplayName
  };
};
