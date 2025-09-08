import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface BulkDeleteSalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  selectedSales: any[];
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function BulkDeleteSalesDialog({
  open,
  onOpenChange,
  selectedCount,
  selectedSales,
  onConfirm,
  isLoading = false
}: BulkDeleteSalesDialogProps) {
  const totalAmount = selectedSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">
                Delete {selectedCount} Sales
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Are you sure you want to delete {selectedCount} {selectedCount === 1 ? 'sale' : 'sales'}? 
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">This will permanently:</p>
              <ul className="space-y-1 list-disc list-inside mb-3">
                <li>Remove all selected sales records</li>
                <li>Delete associated sale items</li>
                <li>Restore inventory stock for sold items (returned to available)</li>
                <li>Update product unit status from 'sold' to 'available'</li>
                <li>Remove financial records worth €{totalAmount.toFixed(2)}</li>
              </ul>
              <p className="text-xs text-destructive font-medium">
                ⚠️ Inventory will be automatically restored for all deleted sales
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedCount} {selectedCount === 1 ? 'Sale' : 'Sales'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}