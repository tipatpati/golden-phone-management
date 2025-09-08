
import React, { useState } from "react";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common/BaseDialog";
import { FormField } from "@/components/common/FormField";
import { Edit } from "lucide-react";
import { useUpdateSale, type Sale } from "@/services";
import { useAuth } from "@/contexts/AuthContext";

interface EditSaleDialogProps {
  sale: Sale;
}

export function EditSaleDialog({ sale }: EditSaleDialogProps) {
  const { userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(sale.status);
  const [paymentMethod, setPaymentMethod] = useState(sale.payment_method);
  const [notes, setNotes] = useState(sale.notes || "");

  const updateSale = useUpdateSale();

  // Only show for super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  const handleSubmit = async () => {
    try {
      await updateSale.mutateAsync({
        id: sale.id,
        data: {
          status: status as any,
          payment_method: paymentMethod as any,
          notes
        }
      });
      setOpen(false);
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors" onClick={() => setOpen(true)}>
        <Edit className="h-4 w-4" />
      </Button>
      
      <BaseDialog
        title={`Modifica Garentille - ${sale.sale_number}`}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        isLoading={updateSale.isPending}
        submitText={updateSale.isPending ? "Aggiornando..." : "Aggiorna Garentille"}
        cancelText="Annulla"
        maxWidth="md"
      >
        <div className="space-y-4">
          <FormField
            label="Status"
            type="select"
            value={status}
            onChange={setStatus}
            options={[
              { value: "completed", label: "Completed" },
              { value: "pending", label: "Pending" },
              { value: "cancelled", label: "Cancelled" },
              { value: "refunded", label: "Refunded" }
            ]}
          />

          <FormField
            label="Payment Method"
            type="select"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={[
              { value: "cash", label: "Cash" },
              { value: "card", label: "Card" },
              { value: "bank_transfer", label: "Bank Transfer" },
              { value: "other", label: "Other" }
            ]}
          />

          <FormField
            label="Notes"
            type="textarea"
            value={notes}
            onChange={setNotes}
            placeholder="Additional notes..."
          />
        </div>
      </BaseDialog>
    </>
  );
}
