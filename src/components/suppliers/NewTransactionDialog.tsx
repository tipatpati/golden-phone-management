import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionFormV2 } from "./TransactionFormV2";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface NewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTransactionDialog({ open, onOpenChange }: NewTransactionDialogProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    // If trying to close, show confirmation first
    if (!newOpen) {
      setShowCloseConfirm(true);
    } else {
      onOpenChange(newOpen);
    }
  };
  
  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onOpenChange(false);
  };
  
  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[600px] w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>New Supplier Transaction</DialogTitle>
          </DialogHeader>
          <TransactionFormV2 onSuccess={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <ConfirmDialog
        open={showCloseConfirm}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
        title="Close Supplier Transaction?"
        message="Are you sure you want to close? Any unsaved transaction data will be lost."
        confirmText="Close Anyway"
        cancelText="Keep Working"
        variant="destructive"
      />
    </>
  );
}