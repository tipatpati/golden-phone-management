import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/enhanced-button";
import { Eye, FileText, Calendar, Euro, User, Package, CreditCard } from "lucide-react";
import { DataCard, DataTable } from "@/components/common";
import type { SaleReturn } from "@/services/sales/returns/types";
import { ReturnDetailsDialog } from "./ReturnDetailsDialog";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";

interface ReturnsListProps {
  returns: SaleReturn[];
  searchTerm?: string;
}

export function ReturnsList({ returns, searchTerm }: ReturnsListProps) {
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);

  const {
    paginatedData: paginatedMobileReturns,
    currentPage: mobilePage,
    totalPages: mobileTotalPages,
    goToPage: mobileGoToPage
  } = usePagination({ data: returns, itemsPerPage: 17 });

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

  const getRefundMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Contanti',
      card: 'Carta',
      bank_transfer: 'Bonifico',
      store_credit: 'Credito',
      exchange: 'Scambio'
    };
    return labels[method] || method;
  };

  const columns = [
    {
      key: 'return_number' as keyof SaleReturn,
      header: 'Reso #',
      render: (value: string) => (
        <div className="font-mono font-medium text-sm whitespace-nowrap">#{value}</div>
      )
    },
    {
      key: 'sale' as keyof SaleReturn,
      header: 'Vendita',
      render: (value: any) => (
        <div className="font-mono text-sm">
          {value?.sale_number ? `#${value.sale_number}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'return_items' as keyof SaleReturn,
      header: 'Articoli',
      render: (value: any[]) => {
        const itemCount = value?.length || 0;
        return (
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">
              {itemCount} articol{itemCount === 1 ? 'o' : 'i'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'refund_amount' as keyof SaleReturn,
      header: 'Rimborso',
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-bold text-primary text-base whitespace-nowrap">
          €{value.toFixed(2)}
        </div>
      )
    },
    {
      key: 'restocking_fee' as keyof SaleReturn,
      header: 'Costo Riassortimento',
      align: 'right' as const,
      render: (value: number) => (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {value > 0 ? `-€${value.toFixed(2)}` : '€0.00'}
        </div>
      )
    },
    {
      key: 'refund_method' as keyof SaleReturn,
      header: 'Metodo Rimborso',
      render: (value: string) => (
        <div className="text-sm capitalize">{getRefundMethodLabel(value)}</div>
      )
    },
    {
      key: 'status' as keyof SaleReturn,
      header: 'Stato',
      align: 'center' as const,
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value === 'completed' ? 'Completato' : value === 'pending' ? 'In Attesa' : 'Annullato'}
        </Badge>
      )
    },
    {
      key: 'return_date' as keyof SaleReturn,
      header: 'Data Reso',
      align: 'right' as const,
      render: (value: string) => (
        <div className="text-sm text-right">
          <div className="font-medium whitespace-nowrap">
            {format(new Date(value), "dd/MM/yyyy")}
          </div>
          <div className="text-muted-foreground text-xs whitespace-nowrap">
            {format(new Date(value), "HH:mm")}
          </div>
        </div>
      )
    }
  ];

  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      label: "Dettagli",
      onClick: (returnRecord: SaleReturn) => setSelectedReturn(returnRecord),
      className: "hover:bg-blue-50 hover:text-blue-600"
    }
  ];

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={returns}
          columns={columns}
          actions={actions}
          getRowKey={(returnRecord) => returnRecord.id}
          onRowClick={(returnRecord) => setSelectedReturn(returnRecord)}
        />
      </div>

      {/* Mobile & Tablet Card Layout */}
      <div className="lg:hidden space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {paginatedMobileReturns.map((returnRecord) => (
            <DataCard
              key={returnRecord.id}
              title={`Reso #${returnRecord.return_number}`}
              subtitle={returnRecord.returned_by_user?.username || "Unknown"}
              icon={<FileText className="h-5 w-5 text-primary" />}
              badge={{
                text: returnRecord.status === 'completed' ? 'Completato' : returnRecord.status === 'pending' ? 'In Attesa' : 'Annullato',
                variant: getStatusColor(returnRecord.status) as any
              }}
              onClick={() => setSelectedReturn(returnRecord)}
              fields={[
                {
                  label: "Vendita",
                  value: returnRecord.sale?.sale_number ? `#${returnRecord.sale.sale_number}` : 'N/A'
                },
                {
                  label: "Articoli Resi",
                  value: `${returnRecord.return_items?.length || 0} articoli`
                },
                {
                  label: "Rimborso",
                  value: `€${returnRecord.refund_amount.toFixed(2)}`
                },
                {
                  label: "Costo Riassortimento",
                  value: returnRecord.restocking_fee > 0 ? `-€${returnRecord.restocking_fee.toFixed(2)}` : '€0.00'
                },
                {
                  label: "Metodo Rimborso",
                  value: getRefundMethodLabel(returnRecord.refund_method)
                },
                {
                  label: "Data Reso",
                  value: format(new Date(returnRecord.return_date), "dd/MM/yyyy HH:mm")
                }
              ]}
            />
          ))}
        </div>
      </div>

      {/* Return Details Dialog */}
      {selectedReturn && (
        <ReturnDetailsDialog
          returnRecord={selectedReturn}
          open={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
        />
      )}
    </>
  );
}
