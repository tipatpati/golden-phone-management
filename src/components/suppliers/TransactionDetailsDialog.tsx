import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SupplierTransaction {
  id: string;
  transaction_number: string;
  type: string;
  status: string;
  total_amount: number;
  transaction_date: string;
  notes?: string;
  suppliers?: {
    name: string;
    email?: string;
    phone?: string;
  };
}

interface TransactionDetailsDialogProps {
  transaction: SupplierTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-purple-100 text-purple-800';
      case 'return':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Transaction Number
            </label>
            <p className="text-sm font-mono">{transaction.transaction_number}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <div className="mt-1">
                <Badge className={cn("text-xs", getTypeColor(transaction.type))}>
                  {transaction.type}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                <Badge className={cn("text-xs", getStatusColor(transaction.status))}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Amount
            </label>
            <p className="text-lg font-semibold">€{transaction.total_amount.toFixed(2)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Date
            </label>
            <p className="text-sm">
              {format(new Date(transaction.transaction_date), "MMM dd, yyyy 'at' HH:mm")}
            </p>
          </div>

          {transaction.suppliers && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Supplier
              </label>
              <div className="mt-1">
                <p className="font-medium">{transaction.suppliers.name}</p>
                {transaction.suppliers.email && (
                  <p className="text-sm text-muted-foreground">{transaction.suppliers.email}</p>
                )}
                {transaction.suppliers.phone && (
                  <p className="text-sm text-muted-foreground">{transaction.suppliers.phone}</p>
                )}
              </div>
            </div>
          )}

          {transaction.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Notes
              </label>
              <p className="text-sm mt-1">{transaction.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}