import React, { useState } from "react";
import { UnifiedSupplierLabels } from "../components/UnifiedSupplierLabels";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, X } from "lucide-react";
import { logger } from "@/utils/logger";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";

interface SupplierTransaction {
  id: string;
  transaction_number: string;
  type: string;
  status: string;
  total_amount: number;
  transaction_date: string;
  suppliers?: {
    name: string;
  };
}

interface SupplierAcquisitionPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: SupplierTransaction[];
  isLoading?: boolean;
}

export function SupplierAcquisitionPrintDialog({
  open,
  onOpenChange,
  transactions,
  isLoading = false
}: SupplierAcquisitionPrintDialogProps) {
  
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  console.log('🖨️ SupplierAcquisitionPrintDialog OPENED', {
    open,
    transactionsReceived: transactions,
    transactionsCount: transactions.length
  });
  
  // Filter for completed purchase transactions only
  const eligibleTransactions = transactions.filter(
    transaction => transaction.type === "purchase" && transaction.status === "completed"
  );

  const transactionIds = eligibleTransactions.map(t => t.id);
  const companyName = "GOLDEN PHONE SRL";
  
  console.log('🖨️ Filtered eligible transactions', {
    totalTransactions: transactions.length,
    eligibleCount: eligibleTransactions.length,
    transactionIds,
    eligibleTransactions
  });
  
  logger.info('Simplified SupplierAcquisitionPrintDialog initialized', {
    transactionIds,
    companyName
  });

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
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
        >
          
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Supplier Acquisition - Thermal Labels
              <Badge variant="outline">{transactionIds.length} transactions</Badge>
            </DialogTitle>
          </DialogHeader>

        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Ready for Printing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Thermal labels will be generated for all serialized products from the selected transactions.
                Each label will display product info, serial number, and maximum selling price.
              </p>
            </CardContent>
          </Card>

          {/* Simple Thermal Label Print Component */}
          <UnifiedSupplierLabels 
            transactionIds={transactionIds}
            companyName={companyName}
          />
        </div>
      </DialogContent>
    </Dialog>

    {/* Close Confirmation Dialog */}
    <ConfirmDialog
      open={showCloseConfirm}
      onClose={handleCancelClose}
      onConfirm={handleConfirmClose}
      title="Close Label Printing?"
      message="Are you sure you want to close? Any unsaved label selections or configurations will be lost."
      confirmText="Close Anyway"
      cancelText="Keep Working"
      variant="destructive"
    />
    </>
  );
}