import React, { useState, useMemo } from "react";
import { DataTable, DataCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Calendar } from "lucide-react";
import { useSupplierTransactions } from "@/services/suppliers/SupplierTransactionService";
import { EditTransactionDialogV2 } from "./EditTransactionDialogV2";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { AdvancedTransactionFilters } from "./AdvancedTransactionFilters";
import { TransactionSummaryStats } from "./TransactionSummaryStats";
import { BulkTransactionActions } from "./BulkTransactionActions";
import type { TransactionSearchFilters, SupplierTransaction } from "@/services/suppliers/types";

interface TransactionsTableProps {
  searchTerm: string;
}

export function TransactionsTable({ searchTerm }: TransactionsTableProps) {
  const [filters, setFilters] = useState<TransactionSearchFilters>({
    searchTerm,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Update filters when searchTerm prop changes
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, [searchTerm]);
  
  const { data: transactions, isLoading, error, refetch } = useSupplierTransactions(filters);

  const [selectedTransaction, setSelectedTransaction] = useState<SupplierTransaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const resetFilters = () => {
    setFilters({ searchTerm: "" });
  };

  const handleActionComplete = () => {
    refetch();
    setSelectedIds([]);
  };

  const columns: any[] = [
    {
      key: "select",
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={selectedIds.length === (transactions?.length || 0) && (transactions?.length || 0) > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedIds(transactions?.map(t => t.id) || []);
            } else {
              setSelectedIds([]);
            }
          }}
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={selectedIds.includes(row.original.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedIds(prev => [...prev, row.original.id]);
            } else {
              setSelectedIds(prev => prev.filter(id => id !== row.original.id));
            }
          }}
        />
      ),
    },
    {
      key: "transaction_number",
      accessor: "transaction_number",
      header: "Transaction #",
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.transaction_number}</div>
      ),
    },
    {
      accessor: "suppliers.name",
      header: "Supplier",
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.suppliers?.name || 'Unknown'}</div>
      ),
    },
    {
      accessor: "type",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge variant={getTypeColor(row.original.type)}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessor: "total_amount",
      header: "Amount",
      cell: ({ row }: any) => (
        <div className="font-medium">€{row.original.total_amount.toFixed(2)}</div>
      ),
    },
    {
      accessor: "transaction_date",
      header: "Date",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(row.original.transaction_date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      accessor: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessor: "actions",
      header: "",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedTransaction(row.original);
                setShowDetailsDialog(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedTransaction(row.original);
                setShowEditDialog(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedTransaction(row.original);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "purchase": return "default";
      case "payment": return "secondary";
      case "return": return "destructive";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <TransactionSummaryStats filters={filters} />
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <TransactionSummaryStats filters={filters} />
      
      {/* Advanced Filters */}
      <AdvancedTransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      {/* Bulk Actions */}
      {transactions && transactions.length > 0 && (
        <BulkTransactionActions
          transactions={transactions}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onActionComplete={handleActionComplete}
        />
      )}

      {/* Data Table */}
      <div className="hidden md:block">
        <DataTable
          data={transactions || []}
          columns={columns}
          searchable={false} // We handle search via filters now
          actions={[]}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {(transactions || []).map((transaction) => (
          <div key={transaction.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{transaction.transaction_number}</h3>
                <p className="text-sm text-muted-foreground">{transaction.suppliers?.name || 'Unknown Supplier'}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getTypeColor(transaction.type)}>{transaction.type}</Badge>
                <Badge variant={getStatusColor(transaction.status)}>{transaction.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Amount: €{transaction.total_amount.toFixed(2)}</div>
              <div>Date: {new Date(transaction.transaction_date).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => { setSelectedTransaction(transaction); setShowDetailsDialog(true); }}>
                View
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setSelectedTransaction(transaction); setShowEditDialog(true); }}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setSelectedTransaction(transaction); setShowDeleteDialog(true); }}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <EditTransactionDialogV2
        transaction={selectedTransaction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      <DeleteTransactionDialog
        transaction={selectedTransaction}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}