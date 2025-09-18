import React from "react";
import { ThermalLabelGenerator, useThermalLabels } from "@/components/inventory/labels";
import { useSupplierTransactionProducts } from "../hooks/useSupplierTransactionProducts";
import { mapProductsForLabels } from "@/utils/mapProductForLabels";
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

  // Transform products to standardized format using the same utility as inventory
  const mappedProducts = mapProductsForLabels(transactionProducts);
  
  // Use the same thermal labels hook as inventory for consistent barcode generation
  const thermalLabels = useThermalLabels(mappedProducts);

  // Log for debugging
  React.useEffect(() => {
    if (open) {
      logger.info('Supplier acquisition print dialog opened', {
        totalTransactions: transactions.length,
        eligibleTransactions: eligibleTransactions.length,
        transactionIds,
        productsCount: transactionProducts.length,
        labelsCount: thermalLabels.length
      }, 'SupplierAcquisitionPrintDialog');
    }
  }, [open, transactions, eligibleTransactions, transactionProducts, thermalLabels]);

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

  // Determine company name from supplier (use first supplier for consistency)
  const companyName = eligibleTransactions.length > 0 && eligibleTransactions[0].suppliers?.name 
    ? `Acquired from ${eligibleTransactions[0].suppliers.name}`
    : "GOLDEN PHONE SRL";

  return (
    <ThermalLabelGenerator
      open={open}
      onOpenChange={onOpenChange}
      labels={thermalLabels}
      companyName={companyName}
    />
  );
}