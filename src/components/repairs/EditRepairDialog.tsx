
import React from "react";
import { BaseDialog } from "@/components/common/BaseDialog";
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
    <BaseDialog
      title={`Modifica Riparazione - ${repair.repairNumber || repair.id}`}
      open={open}
      onClose={() => onOpenChange(false)}
      onSubmit={handleSubmit}
      isLoading={updateRepair.isPending}
      submitText={updateRepair.isPending ? 'Aggiornamento...' : 'Aggiorna Riparazione'}
      cancelText="Annulla"
      size="lg"
    >
      <div className="space-y-6">
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
      </div>
    </BaseDialog>
  );
};
