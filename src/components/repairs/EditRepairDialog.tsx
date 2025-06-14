
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateRepair, useTechnicians } from "@/services/useRepairs";
import { useClients } from "@/services/useClients";
import { type Repair } from "./RepairCard";

interface EditRepairDialogProps {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormData = {
  client_id: string;
  technician_id: string;
  device: string;
  imei: string;
  issue: string;
  status: 'quoted' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_completion_date: string;
  cost: number;
  notes: string;
};

export const EditRepairDialog: React.FC<EditRepairDialogProps> = ({ 
  repair, 
  open, 
  onOpenChange 
}) => {
  const [formData, setFormData] = useState<FormData>({
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
  const { data: clients = [] } = useClients();
  const { data: technicians = [] } = useTechnicians();

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
        repair: {
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

  if (!repair) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Riparazione - {repair.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device">Dispositivo *</Label>
              <Input
                id="device"
                value={formData.device}
                onChange={(e) => setFormData({...formData, device: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                value={formData.imei}
                onChange={(e) => setFormData({...formData, imei: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue">Problema *</Label>
            <Textarea
              id="issue"
              value={formData.issue}
              onChange={(e) => setFormData({...formData, issue: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Stato</Label>
              <Select value={formData.status} onValueChange={(value: FormData['status']) => setFormData({...formData, status: value})}>
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
              <Select value={formData.priority} onValueChange={(value: FormData['priority']) => setFormData({...formData, priority: value})}>
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

          <div className="space-y-2">
            <Label htmlFor="estimated_completion_date">Data Completamento Stimata</Label>
            <Input
              id="estimated_completion_date"
              type="date"
              value={formData.estimated_completion_date}
              onChange={(e) => setFormData({...formData, estimated_completion_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Note aggiuntive sulla riparazione"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={updateRepair.isPending}>
              {updateRepair.isPending ? 'Aggiornamento...' : 'Aggiorna Riparazione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
