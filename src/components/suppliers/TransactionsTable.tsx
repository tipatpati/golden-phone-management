import React, { useState, useEffect, Suspense, lazy } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Calendar,
  Eye,
  Edit,
  Trash2,
  Printer,
  ChevronDown,
  ChevronRight,
  Package,
  Hash,
  Barcode
} from "lucide-react";
import { useSupplierTransactions, supplierTransactionApi } from "@/services/suppliers/SupplierTransactionService";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchBar } from "@/components/ui/search-bar";

// Lazy load heavy dialogs for better performance
const EditTransactionDialogV2 = lazy(() => import("./EditTransactionDialogV2").then(m => ({ default: m.EditTransactionDialogV2 })));
const TransactionDetailsDialog = lazy(() => import("./TransactionDetailsDialog").then(m => ({ default: m.TransactionDetailsDialog })));
const DeleteTransactionDialog = lazy(() => import("./DeleteTransactionDialog").then(m => ({ default: m.DeleteTransactionDialog })));
import { AdvancedTransactionFilters } from "./AdvancedTransactionFilters";
import { TransactionSummaryStats } from "./TransactionSummaryStats";
import { SupplierAcquisitionPrintDialog } from "./dialogs/SupplierAcquisitionPrintDialog";
import type { TransactionSearchFilters, SupplierTransaction } from "@/services/suppliers/types";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";

interface TransactionsTableProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export const TransactionsTable = React.memo(function TransactionsTable({
  searchQuery = '',
  onSearch
}: TransactionsTableProps) {
  const [filters, setFilters] = useState<TransactionSearchFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  // Debounce search input for better performance (300ms delay)
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  const {
    data: allTransactions,
    isLoading,
    error
  } = useSupplierTransactions(filters);

  // Client-side search filtering with priority ordering
  const transactions = React.useMemo(() => {
    if (!allTransactions) return [];
    if (!debouncedSearchQuery.trim()) return allTransactions;

    return supplierTransactionApi.searchTransactions(allTransactions, debouncedSearchQuery);
  }, [allTransactions, debouncedSearchQuery]);
  
  // Auto-expand transactions with matching items when searching
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const term = debouncedSearchQuery.trim().toLowerCase();
      const transactionsWithMatches = transactions.filter(t =>
        t.items?.some(item =>
          item.products?.brand?.toLowerCase().includes(term) ||
          item.products?.model?.toLowerCase().includes(term) ||
          item._enrichedUnits?.some(unit =>
            unit.serial_number?.toLowerCase().includes(term) ||
            unit.barcode?.toLowerCase().includes(term)
          )
        )
      );
      setExpandedTransactions(new Set(transactionsWithMatches.map(t => t.id)));
    } else {
      setExpandedTransactions(new Set());
    }
  }, [debouncedSearchQuery, transactions]);

  const handleClearSearch = () => {
    setLocalSearchQuery('');
  };

  const [selectedTransaction, setSelectedTransaction] = useState<SupplierTransaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const resetFilters = () => {
    setFilters({});
  };

  const handleActionComplete = () => {
    setSelectedIds([]);
  };

  const toggleTransactionExpansion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTransactions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const itemMatchesSearch = (item: any, term: string) => {
    const searchLower = term.toLowerCase();
    
    // Check product brand/model
    if (item.products?.brand?.toLowerCase().includes(searchLower) ||
        item.products?.model?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Check enriched units
    if (item._enrichedUnits?.some((unit: any) =>
      unit.serial_number?.toLowerCase().includes(searchLower) ||
      unit.barcode?.toLowerCase().includes(searchLower)
    )) {
      return true;
    }
    
    return false;
  };

  const unitMatchesSearch = (unit: any, term: string) => {
    const searchLower = term.toLowerCase();
    return unit.serial_number?.toLowerCase().includes(searchLower) ||
           unit.barcode?.toLowerCase().includes(searchLower);
  };

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

  const { 
    paginatedData, 
    currentPage, 
    totalPages, 
    goToPage 
  } = usePagination({ 
    data: transactions, 
    itemsPerPage: 20 
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading transactions: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const searchTerm = debouncedSearchQuery;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <SearchBar
          value={localSearchQuery}
          onChange={setLocalSearchQuery}
          placeholder="Search by transaction #, supplier, product, IMEI, barcode..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch} variant="default">
          Search
        </Button>
        {debouncedSearchQuery && (
          <Button onClick={handleClearSearch} variant="outline">
            Clear
          </Button>
        )}
      </div>

      {/* Filters */}
      <AdvancedTransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      {/* Summary Stats */}
      <TransactionSummaryStats filters={filters} />

      {/* Results Info */}
      {activeSearchQuery && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {transactions.length > 0 
              ? `Showing ${transactions.length} transaction(s) for "${debouncedSearchQuery}"`
              : `No transactions found for "${debouncedSearchQuery}"`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(paginatedData.map(t => t.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {debouncedSearchQuery
                    ? `No transactions found for "${debouncedSearchQuery}"`
                    : 'No transactions found'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((transaction) => {
                const isSelected = selectedIds.includes(transaction.id);
                const isExpanded = expandedTransactions.has(transaction.id);
                const hasItems = transaction.items && transaction.items.length > 0;
                const matchedItems = searchTerm
                  ? transaction.items?.filter(item => itemMatchesSearch(item, searchTerm)) || []
                  : [];

                return (
                  <React.Fragment key={transaction.id}>
                    {/* Main Transaction Row */}
                    <TableRow 
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        isSelected && "bg-muted/50",
                        matchedItems.length > 0 && "bg-blue-50/30"
                      )}
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(prev => [...prev, transaction.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== transaction.id));
                              }
                            }}
                          />
                          {hasItems && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => toggleTransactionExpansion(transaction.id, e)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium font-mono">{transaction.transaction_number}</div>
                          {matchedItems.length > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {matchedItems.length} matched item{matchedItems.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.suppliers?.name || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(transaction.total_amount)}</div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDeleteDialog(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {transaction.type === 'purchase' && transaction.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowPrintDialog(true);
                              }}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Items */}
                    {isExpanded && hasItems && (
                      <>
                        {(searchTerm && searchTerm.trim()
                          ? transaction.items!.filter(item => itemMatchesSearch(item, searchTerm))
                          : transaction.items!
                        ).map((item) => {
                          const isItemMatched = searchTerm && itemMatchesSearch(item, searchTerm);
                          const hasUnits = item._enrichedUnits && item._enrichedUnits.length > 0;

                          return (
                            <React.Fragment key={item.id}>
                              {/* Item Row */}
                              <TableRow 
                                className={cn(
                                  "bg-muted/10 border-l-4",
                                  isItemMatched ? "border-l-blue-400 bg-blue-50/30" : "border-l-transparent"
                                )}
                              >
                                <TableCell></TableCell>
                                <TableCell colSpan={3}>
                                  <div className="pl-8 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <span className={cn(
                                        "font-medium",
                                        isItemMatched && "text-blue-700"
                                      )}>
                                        {item.products?.brand} {item.products?.model}
                                      </span>
                                      {isItemMatched && !hasUnits && (
                                        <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                                          Match
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Qty: {item.quantity} × {formatCurrency(item.unit_cost)} = {formatCurrency(item.total_cost)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell colSpan={4}></TableCell>
                              </TableRow>

                              {/* Unit Rows */}
                              {hasUnits && item._enrichedUnits!.map((unit) => {
                                const isUnitMatched = searchTerm && unitMatchesSearch(unit, searchTerm);
                                const searchLower = searchTerm?.toLowerCase() || '';

                                return (
                                  <TableRow
                                    key={unit.id}
                                    className={cn(
                                      "bg-muted/20 border-l-4",
                                      isUnitMatched ? "border-l-blue-500 bg-blue-50/50" : "border-l-transparent"
                                    )}
                                  >
                                    <TableCell></TableCell>
                                    <TableCell colSpan={4}>
                                      <div className="pl-16 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Hash className="h-3 w-3 text-muted-foreground" />
                                          <span className={cn(
                                            "text-sm font-mono",
                                            isUnitMatched && "font-semibold text-blue-700"
                                          )}>
                                            {unit.serial_number}
                                          </span>
                                          {isUnitMatched && (
                                            <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                                              Match
                                            </Badge>
                                          )}
                                        </div>
                                        {unit.barcode && (
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Barcode className="h-3 w-3" />
                                            <span className={cn(
                                              "font-mono",
                                              isUnitMatched && unit.barcode.toLowerCase().includes(searchLower) && "font-semibold text-blue-700"
                                            )}>
                                              {unit.barcode}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell colSpan={3}></TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          pageSize={20}
          totalItems={transactions.length}
        />
      )}

      {/* Dialogs - Lazy loaded for performance */}
      <Suspense fallback={<div />}>
        <TransactionDetailsDialog
          transaction={selectedTransaction}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />

        {selectedTransaction && (
          <>
            <EditTransactionDialogV2
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              transaction={selectedTransaction}
            />

            <DeleteTransactionDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              transaction={selectedTransaction}
            />

            <SupplierAcquisitionPrintDialog
              open={showPrintDialog}
              onOpenChange={setShowPrintDialog}
              transactions={[selectedTransaction]}
            />
          </>
        )}
      </Suspense>
    </div>
  );
});