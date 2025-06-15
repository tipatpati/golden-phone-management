
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
          <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Modifica Riparazione - {repair.repairNumber || repair.id}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg">
              Annulla
            </Button>
            <Button type="submit" disabled={updateRepair.isPending} size="lg" className="shadow-lg">
              {updateRepair.isPending ? 'Aggiornamento...' : 'Aggiorna Riparazione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
