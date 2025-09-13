/**
 * @deprecated Use EditTransactionDialog instead
 * This component has been replaced with a better architecture
 */
import React from "react";
import { EditTransactionDialog } from "./EditTransactionDialog";
import type { SupplierTransaction } from "@/services/suppliers/types";

interface EditTransactionDialogV2Props {
  transaction: SupplierTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Wrapper component that delegates to the new EditTransactionDialog
 */
export function EditTransactionDialogV2({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogV2Props) {
  console.warn('EditTransactionDialogV2 is deprecated. Use EditTransactionDialog instead.');
  
  // Delegate to the new implementation
  return (
    <EditTransactionDialog
      transaction={transaction}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}