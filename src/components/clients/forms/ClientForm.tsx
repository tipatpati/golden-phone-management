import React from "react";
import { ClientFormProps } from "./types";
import { ClientBusinessInfo } from "./ClientBusinessInfo";
import { ClientContactInfo } from "./ClientContactInfo";
import { FormField } from "@/components/common/FormField";
import { CLIENT_STATUS_OPTIONS } from "./types";
import { useClientForm } from "./hooks/useClientForm";
import { DraftIndicator } from "@/components/ui/draft-indicator";
import { DraftRestoreDialog } from "@/components/ui/draft-restore-dialog";

export function ClientForm({ 
  initialData, 
  onSubmit, 
  isLoading, 
  submitText = "Save Client" 
}: ClientFormProps) {
  const {
    formData,
    isSubmitting,
    updateField,
    handleSubmit,
    getFieldError,
    isDraftAvailable,
    isAutoSaving,
    lastSavedAt,
    restoreDraft,
    deleteDraft,
    currentDraft
  } = useClientForm({ initialData, onSubmit });

  const [showDraftDialog, setShowDraftDialog] = React.useState(false);

  // Check for draft on mount
  React.useEffect(() => {
    if (isDraftAvailable && !initialData && currentDraft) {
      setShowDraftDialog(true);
    }
  }, [isDraftAvailable, initialData, currentDraft]);

  // Expose handleSubmit to parent components
  React.useEffect(() => {
    (window as any).__currentFormSubmit = handleSubmit;
    return () => {
      (window as any).__currentFormSubmit = null;
    };
  }, [handleSubmit]);

  return (
    <div className="space-y-6">
      {/* Draft Indicator - Subtle positioning */}
      <div className="flex justify-end">
        <DraftIndicator
          isAutoSaving={isAutoSaving}
          lastSavedAt={lastSavedAt}
          isDraftAvailable={isDraftAvailable}
          onRestoreDraft={() => setShowDraftDialog(true)}
          onClearDraft={deleteDraft}
          className="opacity-75 hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Business Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informazioni Cliente</h3>
        <ClientBusinessInfo
          formData={formData}
          onFieldChange={updateField}
          getFieldError={getFieldError}
        />
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Dettagli Contatto</h3>
        <ClientContactInfo
          formData={formData}
          onFieldChange={updateField}
          getFieldError={getFieldError}
        />
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Stato Cliente</h3>
        <FormField
          type="select"
          label="Stato"
          value={formData.status || 'active'}
          onChange={(value) => updateField('status', value)}
          options={CLIENT_STATUS_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
          required
          error={getFieldError('status')}
          description="I clienti attivi possono effettuare ordini e accedere ai servizi"
        />
      </div>

      {/* Form-level error display */}
      {getFieldError('form') && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{getFieldError('form')}</p>
        </div>
      )}

      {/* Draft Restore Dialog */}
      <DraftRestoreDialog
        isOpen={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        draft={currentDraft}
        onRestore={() => {
          restoreDraft();
          setShowDraftDialog(false);
        }}
        onDiscard={() => {
          deleteDraft();
          setShowDraftDialog(false);
        }}
      />
    </div>
  );
}