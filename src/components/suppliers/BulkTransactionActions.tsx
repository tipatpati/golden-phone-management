import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  useUpdateSupplierTransaction, 
  useDeleteSupplierTransaction 
} from "@/services/suppliers/SupplierTransactionService";
import { Check, X, Trash2, Edit } from "lucide-react";
import type { SupplierTransaction } from "@/services/suppliers/types";

interface BulkTransactionActionsProps {
  transactions: SupplierTransaction[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onActionComplete: () => void;
}

export function BulkTransactionActions({
  transactions,
  selectedIds,
  onSelectionChange,
  onActionComplete,
}: BulkTransactionActionsProps) {
  const { toast } = useToast();
  const updateTransaction = useUpdateSupplierTransaction();
  const deleteTransaction = useDeleteSupplierTransaction();
  
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'status' | 'delete' | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'completed' | 'cancelled'>('completed');

  const selectedTransactions = transactions.filter(t => selectedIds.includes(t.id));
  const hasSelection = selectedIds.length > 0;
  const isAllSelected = selectedIds.length === transactions.length && transactions.length > 0;
  const isPartialSelected = selectedIds.length > 0 && selectedIds.length < transactions.length;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(transactions.map(t => t.id));
    }
  }, [isAllSelected, onSelectionChange, transactions]);

  const handleBulkStatusUpdate = async () => {
    try {
      const updates = selectedIds.map(id => 
        updateTransaction.mutateAsync({
          id,
          updates: { status: newStatus }
        })
      );
      
      await Promise.all(updates);
      
      toast({
        title: "Success",
        description: `Updated ${selectedIds.length} transaction${selectedIds.length !== 1 ? 's' : ''} to ${newStatus}`,
      });
      
      onSelectionChange([]);
      onActionComplete();
      setShowBulkDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update transactions",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletes = selectedIds.map(id => 
        deleteTransaction.mutateAsync(id)
      );
      
      await Promise.all(deletes);
      
      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} transaction${selectedIds.length !== 1 ? 's' : ''}`,
      });
      
      onSelectionChange([]);
      onActionComplete();
      setShowBulkDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transactions",
        variant: "destructive",
      });
    }
  };

  const openBulkAction = (action: 'status' | 'delete') => {
    setBulkAction(action);
    setShowBulkDialog(true);
  };

  const getStatusCounts = () => {
    const counts = {
      pending: selectedTransactions.filter(t => t.status === 'pending').length,
      completed: selectedTransactions.filter(t => t.status === 'completed').length,
      cancelled: selectedTransactions.filter(t => t.status === 'cancelled').length,
    };
    return counts;
  };

  return (
    <>
      {/* Selection Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {hasSelection 
              ? `${selectedIds.length} of ${transactions.length} selected`
              : `Select transactions (${transactions.length} total)`
            }
          </span>
        </div>

        {hasSelection && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {selectedIds.length} selected
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openBulkAction('status')}
              disabled={updateTransaction.isPending}
            >
              <Edit className="h-4 w-4 mr-1" />
              Update Status
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openBulkAction('delete')}
              disabled={deleteTransaction.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'status' ? 'Update Transaction Status' : 'Delete Transactions'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {bulkAction === 'status' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Update status for {selectedIds.length} selected transaction{selectedIds.length !== 1 ? 's' : ''}:
                </p>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {Object.entries(getStatusCounts()).map(([status, count]) => (
                    <div key={status} className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{count}</div>
                      <div className="text-muted-foreground capitalize">{status}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Status:</label>
                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete {selectedIds.length} transaction{selectedIds.length !== 1 ? 's' : ''}? 
                  This action cannot be undone.
                </p>
                
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ This will permanently delete:
                  </p>
                  <ul className="text-sm text-destructive mt-1 space-y-1">
                    <li>• All transaction records</li>
                    <li>• Associated transaction items</li>
                    <li>• Transaction history</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={bulkAction === 'status' ? handleBulkStatusUpdate : handleBulkDelete}
              disabled={updateTransaction.isPending || deleteTransaction.isPending}
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
            >
              {updateTransaction.isPending || deleteTransaction.isPending ? (
                "Processing..."
              ) : bulkAction === 'status' ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Update Status
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Transactions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}