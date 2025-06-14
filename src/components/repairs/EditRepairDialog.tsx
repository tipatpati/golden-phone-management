
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Repair } from "./RepairCard";
import { useEditRepairForm } from "./hooks/useEditRepairForm";
import { ClientTechnicianSection } from "./form-sections/ClientTechnicianSection";
import { DeviceInfoSection } from "./form-sections/DeviceInfoSection";
import { StatusPrioritySection } from "./form-sections/StatusPrioritySection";
import { AdditionalInfoSection } from "./form-sections/AdditionalInfoSection";

interface EditRepairDialogProps {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditRepairDialog: React.FC<EditRepairDialogProps> = ({ 
  repair, 
  open, 
  onOpenChange 
}) => {
  const {
    formData,
    setFormData,
    clients,
    technicians,
    updateRepair,
    handleSubmit,
    getClientDisplayName
  } = useEditRepairForm(repair, open, onOpenChange);

  if (!repair) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Riparazione - {repair.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ClientTechnicianSection
            formData={formData}
            setFormData={setFormData}
            clients={clients}
            technicians={technicians}
            getClientDisplayName={getClientDisplayName}
          />

          <DeviceInfoSection
            formData={formData}
            setFormData={setFormData}
          />

          <StatusPrioritySection
            formData={formData}
            setFormData={setFormData}
          />

          <AdditionalInfoSection
            formData={formData}
            setFormData={setFormData}
          />

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
