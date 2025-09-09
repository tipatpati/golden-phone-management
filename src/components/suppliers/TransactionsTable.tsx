import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupplierTransactions } from "@/services/useSupplierTransactions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";

interface TransactionsTableProps {
  searchTerm: string;
}

export function TransactionsTable({ searchTerm }: TransactionsTableProps) {
  const { data: transactions, isLoading } = useSupplierTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const filteredTransactions = transactions?.filter((transaction) =>
    transaction.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'payment':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'return':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction</TableHead>
            <TableHead className="hidden sm:table-cell">Supplier</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <div className="truncate">{transaction.transaction_number}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">
                      {transaction.suppliers?.name}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      <Badge className={cn("text-xs", getTypeColor(transaction.type))}>
                        {transaction.type}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{transaction.suppliers?.name || "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge className={cn("text-xs", getTypeColor(transaction.type))}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">€{transaction.total_amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground lg:hidden">
                      {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", getStatusColor(transaction.status))}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <EditTransactionDialog
        transaction={selectedTransaction}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteTransactionDialog
        transaction={selectedTransaction}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}