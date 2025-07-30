import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, User, CreditCard, CalendarDays, Edit2, Trash2, Eye } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import type { Sale } from "@/services/sales";
import { SaleDetailsDialog } from "./SaleDetailsDialog";
import { format } from "date-fns";

interface SalesListProps {
  sales: Sale[];
  onEdit?: (sale: Sale) => void;
  onDelete?: (sale: Sale) => void;
  onViewDetails?: (sale: Sale) => void;
}

export function SalesList({ sales, onEdit, onDelete, onViewDetails }: SalesListProps) {
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog<Sale>();

  const handleDeleteSale = (sale: Sale) => {
    if (onDelete) {
      showConfirmDialog({
        item: sale,
        title: "Delete Sale",
        message: `Are you sure you want to delete sale #${sale.sale_number}? This action cannot be undone.`,
        onConfirm: () => onDelete(sale)
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Define table columns for desktop view
  const columns = [
    {
      key: 'sale_number' as keyof Sale,
      header: 'Sale #',
      render: (value: string) => (
        <div className="font-mono font-medium">#{value}</div>
      )
    },
    {
      key: 'salesperson' as keyof Sale,
      header: 'Salesperson',
      render: (value: any) => typeof value === 'object' ? value.username || "Unknown" : value || "Unknown"
    },
    {
      key: 'total_amount' as keyof Sale,
      header: 'Amount',
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-medium">€{value.toFixed(2)}</div>
      )
    },
    {
      key: 'payment_method' as keyof Sale,
      header: 'Payment',
      render: (value: string) => (
        <Badge variant="outline">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'status' as keyof Sale,
      header: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'sale_date' as keyof Sale,
      header: 'Date',
      align: 'right' as const,
      render: (value: string) => (
        <div className="text-sm">
          {format(new Date(value), "MMM dd, yyyy")}
        </div>
      )
    }
  ];

  // Define actions
  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      label: "View",
      onClick: () => {}, // Required but not used when renderCustom is provided
      renderCustom: (sale: Sale) => <SaleDetailsDialog sale={sale} />
    },
    ...(onEdit && onDelete ? [
      {
        icon: <Edit2 className="h-4 w-4" />,
        label: "Edit",
        onClick: onEdit
      },
      {
        icon: <Trash2 className="h-4 w-4" />,
        label: "Delete",
        onClick: handleDeleteSale,
        variant: "destructive" as const
      }
    ] : [])
  ];

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={sales}
          columns={columns}
          actions={actions}
          getRowKey={(sale) => sale.id}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1">
        {sales.map((sale) => (
          <div key={sale.id} className="relative">
            <DataCard
              title={`Sale #${sale.sale_number}`}
              subtitle={typeof sale.salesperson === 'object' ? sale.salesperson.username || "Unknown" : sale.salesperson || "Unknown Salesperson"}
              icon={<Receipt className="h-5 w-5 text-primary" />}
              badge={{
                text: sale.status.charAt(0).toUpperCase() + sale.status.slice(1),
                variant: getStatusColor(sale.status) as any
              }}
              fields={[
                {
                  label: "Amount",
                  value: <span className="text-base font-bold text-primary">€{sale.total_amount.toFixed(2)}</span>,
                  className: "text-lg font-bold text-primary"
                },
                {
                  label: "Payment",
                  value: (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                    </div>
                  )
                },
                {
                  label: "Date",
                  value: (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(sale.sale_date), "MMM dd, yyyy")}
                    </div>
                  )
                }
              ]}
              actions={[
                ...(onEdit && onDelete ? [
                  {
                    icon: <Edit2 className="h-3 w-3 mr-1" />,
                    label: "Edit",
                    onClick: () => onEdit(sale)
                  },
                  {
                    icon: <Trash2 className="h-3 w-3 mr-1" />,
                    label: "Delete",
                    onClick: () => handleDeleteSale(sale),
                    variant: "outline" as const,
                    className: "text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  }
                ] : [])
              ]}
            />
            {/* View Details Button aligned with status badge */}
            <div className="absolute top-4 right-16">
              <SaleDetailsDialog 
                sale={sale} 
                trigger={
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary border border-border/50 bg-background/80 backdrop-blur-sm shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.isOpen}
        onClose={hideConfirmDialog}
        onConfirm={confirmAction}
        title={dialogState.title}
        message={dialogState.message}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}