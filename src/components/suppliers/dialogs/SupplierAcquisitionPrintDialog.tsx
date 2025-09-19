import React from "react";
import { ThermalLabelGenerator } from "@/components/inventory/labels/ThermalLabelGenerator";
import { useSupplierTransactionProducts } from "../hooks/useSupplierTransactionProducts";
import { useUnifiedSupplierLabels } from "../hooks/useUnifiedSupplierLabels";
import { logger } from "@/utils/logger";
import { showErrorToast } from "@/components/ui/error-toast";

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
  // Filter for completed purchase transactions only
  const eligibleTransactions = transactions.filter(
    transaction => transaction.type === "purchase" && transaction.status === "completed"
  );

  const transactionIds = eligibleTransactions.map(t => t.id);
  
  // Fetch and transform transaction products for label printing
  const { 
    data: transactionProducts = [], 
    isLoading: productsLoading, 
    error: productsError 
  } = useSupplierTransactionProducts(transactionIds);

  // Use the new unified supplier labels hook for professional barcode management
  const { data: thermalLabels = [], isLoading: labelsLoading } = useUnifiedSupplierLabels(
    transactionProducts,
    {
      useMasterBarcode: false,
      includePrice: true,
      includeCategory: true
    }
  );

  // Log for debugging
  React.useEffect(() => {
    if (open) {
      logger.info('Unified supplier acquisition print dialog opened', {
        totalTransactions: transactions.length,
        eligibleTransactions: eligibleTransactions.length,
        transactionIds,
        productsCount: transactionProducts.length,
        labelsCount: thermalLabels.length,
        labelsLoading
      }, 'SupplierAcquisitionPrintDialog');
    }
  }, [open, transactions, eligibleTransactions, transactionProducts, thermalLabels, labelsLoading]);

  // Handle error states and sold transactions
  React.useEffect(() => {
    if (productsError) {
      logger.error('Failed to load supplier transaction products', productsError, 'SupplierAcquisitionPrintDialog');
      showErrorToast({
        title: 'Error Loading Products',
        description: 'Unable to load transaction products for labeling. Please try again.',
        type: 'error'
      });
      onOpenChange(false);
    }
  }, [productsError, onOpenChange]);

  // Check if all products have been sold (no available units for labels)
  React.useEffect(() => {
    if (open && !productsLoading && !productsError && transactionProducts.length === 0 && eligibleTransactions.length > 0) {
      logger.warn('No available products for labeling - all units may be sold', {
        transactionIds,
        eligibleTransactions: eligibleTransactions.length
      }, 'SupplierAcquisitionPrintDialog');
      
      showErrorToast({
        title: 'Cannot Generate Labels',
        description: 'All units from the selected transactions have been sold and cannot be labeled.',
        type: 'warning'
      });
      onOpenChange(false);
    }
  }, [open, productsLoading, productsError, transactionProducts.length, eligibleTransactions.length, transactionIds, onOpenChange]);

  // Use consistent company name like inventory labels
  const companyName = "GOLDEN PHONE SRL";

  // Show loading state internally if needed
  const totalLoading = isLoading || productsLoading || labelsLoading;

  return (
    <ThermalLabelGenerator
      open={open}
      onOpenChange={onOpenChange}
      labels={thermalLabels}
      companyName={companyName}
    />
  );
}