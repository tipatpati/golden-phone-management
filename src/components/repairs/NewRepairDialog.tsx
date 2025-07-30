import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateRepair, useTechnicians } from "@/services";
import { useClients } from "@/services/useClients";
import { ClientSearchBar } from "./ClientSearchBar";

export const NewRepairDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    technician_id: "",
    device: "",
    imei: "",
    issue: "",
    priority: "normal" as const,
    estimated_completion_date: "",
    labor_cost: 0,
    notes: ""
  });

  const createRepair = useCreateRepair();
  const { data: clients = [] } = useClients();
  const { data: technicians = [] } = useTechnicians();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createRepair.mutateAsync({
        ...formData,
        client_id: formData.client_id || undefined,
        technician_id: formData.technician_id || undefined,
        estimated_completion_date: formData.estimated_completion_date || undefined,
      });
      
      setOpen(false);
      setFormData({
        client_id: "",
        technician_id: "",
        device: "",
        imei: "",
        issue: "",
        priority: "normal",
        estimated_completion_date: "",
        labor_cost: 0,
        notes: ""
      });
    } catch (error) {
      console.error('Error creating repair:', error);
    }
  };

  const getClientDisplayName = (client: any) => {
    if (client.type === 'business') {
      return client.company_name || 'Unnamed Business';
    }
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed Client';
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleClientSelect = (client: any) => {
    setFormData({ ...formData, client_id: client.id });
  };

  const handleClientClear = () => {
    setFormData({ ...formData, client_id: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Riparazione
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Crea Nuova Riparazione</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  <SelectValue placeholder="Assegna tecnico (opzionale)" />
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
                placeholder="es. iPhone 13 Pro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                value={formData.imei}
                onChange={(e) => setFormData({...formData, imei: e.target.value})}
                placeholder="es. 352908764123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue">Problema *</Label>
            <Textarea
              id="issue"
              value={formData.issue}
              onChange={(e) => setFormData({...formData, issue: e.target.value})}
              placeholder="Descrivi il problema da risolvere"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorità</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
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
              <Label htmlFor="labor_cost">Costo Manodopera (€)</Label>
              <Input
                id="labor_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.labor_cost}
                onChange={(e) => setFormData({...formData, labor_cost: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createRepair.isPending}>
              {createRepair.isPending ? 'Creazione...' : 'Crea Riparazione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
