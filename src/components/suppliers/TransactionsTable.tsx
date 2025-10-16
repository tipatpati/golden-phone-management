import React, { useState } from "react";
import { DataTable } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Eye, Edit, Trash2, Printer } from "lucide-react";
import { useSupplierTransactions } from "@/services/suppliers/SupplierTransactionService";
import { useSupplierSearch } from "@/hooks/useSupplierSearch";
import { EditTransactionDialogV2 } from "./EditTransactionDialogV2";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { AdvancedTransactionFilters } from "./AdvancedTransactionFilters";
import { TransactionSummaryStats } from "./TransactionSummaryStats";
import { SupplierAcquisitionPrintDialog } from "./dialogs/SupplierAcquisitionPrintDialog";
import type { TransactionSearchFilters, SupplierTransaction } from "@/services/suppliers/types";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface TransactionsTableProps {
  searchTerm: string;
}

export function TransactionsTable({ searchTerm }: TransactionsTableProps) {
  const [filters, setFilters] = useState<TransactionSearchFilters>({
    searchTerm,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, [searchTerm]);
  
  const { data: transactions, isLoading, error, refetch } = useSupplierTransactions(filters);
  const { results: searchResults, isSearching, hasResults } = useSupplierSearch(searchTerm);
  
  // Filter transactions based on unified search results
  const filteredTransactions = React.useMemo(() => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return transactions || [];
    }
    
    if (!hasResults) {
      return [];
    }
    
    // Get transaction IDs from search results
    const transactionIds = new Set(
      searchResults
        .filter(r => r.type === 'transaction')
        .map(r => r.transaction_id!)
    );
    
    // Get transaction IDs from units found (show their transactions)
    searchResults
      .filter(r => r.type === 'unit' && r.transaction_id)
      .forEach(r => {
        const transaction = (transactions || []).find(
          t => t.transaction_number === r.transaction_number
        );
        if (transaction) {
          transactionIds.add(transaction.id);
        }
      });
    
    return (transactions || []).filter(t => transactionIds.has(t.id));
  }, [searchTerm, transactions, searchResults, hasResults]);

  const [selectedTransaction, setSelectedTransaction] = useState<SupplierTransaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const resetFilters = () => {
    setFilters({ searchTerm: "" });
  };

  const handleActionComplete = () => {
    refetch();
    setSelectedIds([]);
  };

  const columns = [
    {
      key: "select" as keyof SupplierTransaction,
      header: "Select",
      render: (value: any, transaction: SupplierTransaction) => (
        <Checkbox
          checked={selectedIds.includes(transaction.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedIds(prev => [...prev, transaction.id]);
            } else {
              setSelectedIds(prev => prev.filter(id => id !== transaction.id));
            }
          }}
        />
      ),
    },
    {
      key: "transaction_number" as keyof SupplierTransaction,
      header: "Transaction #",
      render: (value: string) => <div className="font-medium">{value}</div>,
    },
    {
      key: "suppliers" as keyof SupplierTransaction,
      header: "Supplier",
      render: (value: any, transaction: SupplierTransaction) => (
        <div className="font-medium">{transaction.suppliers?.name || 'Unknown'}</div>
      ),
    },
    {
      key: "type" as keyof SupplierTransaction,
      header: "Type",
      render: (value: string) => (
        <Badge variant={getTypeColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: "total_amount" as keyof SupplierTransaction,
      header: "Amount",
      render: (value: number) => (
        <div className="font-medium">€{value.toFixed(2)}</div>
      ),
    },
    {
      key: "transaction_date" as keyof SupplierTransaction,
      header: "Date",
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "created_at" as keyof SupplierTransaction,
      header: "Created",
      render: (value: string) => (
        <div className="text-sm">
          <div>{new Date(value).toLocaleDateString()}</div>
          <div className="text-muted-foreground">{new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
    },
    {
      key: "status" as keyof SupplierTransaction,
      header: "Status",
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value}
        </Badge>
      ),
    },
  ];

  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      label: "View Details",
      onClick: (transaction: SupplierTransaction) => {
        setSelectedTransaction(transaction);
        setShowDetailsDialog(true);
      },
    },
    {
      icon: <Edit className="h-4 w-4" />,
      label: "Edit",
      onClick: (transaction: SupplierTransaction) => {
        setSelectedTransaction(transaction);
        setShowEditDialog(true);
      },
    },
    {
      icon: <Printer className="h-4 w-4" />,
      label: "Print Labels",
      onClick: (transaction: SupplierTransaction) => {
        setSelectedTransaction(transaction);
        setShowPrintDialog(true);
      },
      disabled: (transaction: SupplierTransaction) => 
        transaction.type !== "purchase" || transaction.status !== "completed",
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete",
      onClick: (transaction: SupplierTransaction) => {
        setSelectedTransaction(transaction);
        setShowDeleteDialog(true);
      },
      variant: "destructive" as const,
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

  // Mobile pagination
  const {
    paginatedData: mobilePaginatedTransactions,
    currentPage: mobilePage,
    totalPages: mobileTotalPages,
    goToPage: mobileGoToPage
  } = usePagination({ data: filteredTransactions || [], itemsPerPage: 17 });

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
      
      {/* Search Results Info */}
      {searchTerm && hasResults && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Found {searchResults.length} result(s): {searchResults.filter(r => r.type === 'supplier').length} supplier(s), {searchResults.filter(r => r.type === 'transaction').length} transaction(s), {searchResults.filter(r => r.type === 'unit').length} unit(s)
          </AlertDescription>
        </Alert>
      )}
      
      {/* Advanced Filters */}
      <AdvancedTransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      {/* Bulk Selection */}
      {filteredTransactions && filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedIds(filteredTransactions.map(t => t.id));
                } else {
                  setSelectedIds([]);
                }
              }}
            />
            <span className="text-sm font-medium">
              {selectedIds.length > 0 
                ? `${selectedIds.length} of ${filteredTransactions.length} selected`
                : `Select transactions (${filteredTransactions.length} total)`
              }
            </span>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {selectedIds.length} selected
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowPrintDialog(true)}
                disabled={
                  !selectedIds.some(id => {
                    const transaction = filteredTransactions?.find(t => t.id === id);
                    return transaction?.type === "purchase" && transaction?.status === "completed";
                  })
                }
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="hidden md:block">
        <DataTable
          data={filteredTransactions || []}
          columns={columns}
          actions={actions}
          getRowKey={(transaction) => transaction.id}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {mobilePaginatedTransactions.map((transaction) => (
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
            <div className="text-xs text-muted-foreground">
              Created: {new Date(transaction.created_at).toLocaleDateString()} at {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  console.log('Transaction View clicked:', transaction.id);
                  setSelectedTransaction(transaction); 
                  setShowDetailsDialog(true); 
                }}
              >
                View
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  console.log('Transaction Edit clicked:', transaction.id);
                  setSelectedTransaction(transaction); 
                  setShowEditDialog(true); 
                }}
              >
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  setSelectedTransaction(transaction); 
                  setShowPrintDialog(true); 
                }}
                disabled={transaction.type !== "purchase" || transaction.status !== "completed"}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  console.log('Transaction Delete clicked:', transaction.id);
                  setSelectedTransaction(transaction); 
                  setShowDeleteDialog(true); 
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        
        {/* Mobile Pagination */}
        {(filteredTransactions || []).length > 0 && (
          <TablePagination
            currentPage={mobilePage}
            totalPages={mobileTotalPages}
            onPageChange={mobileGoToPage}
            pageSize={17}
            totalItems={filteredTransactions?.length || 0}
          />
        )}
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

      <SupplierAcquisitionPrintDialog
        transactions={
          selectedIds.length > 0 
            ? (filteredTransactions || []).filter(t => selectedIds.includes(t.id))
            : selectedTransaction 
            ? [selectedTransaction]
            : []
        }
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
      />
    </div>
  );
}