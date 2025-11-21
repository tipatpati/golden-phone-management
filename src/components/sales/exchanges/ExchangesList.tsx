import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, Printer, ArrowLeftRight, Package, Euro, XCircle } from "lucide-react";
import { DataCard, DataTable } from "@/components/common";
import type { ExchangeTransaction } from "@/services/sales/exchanges/types";
import { ExchangeDetailsDialog } from "./ExchangeDetailsDialog";
import { ExchangeReceiptDialog } from "./ExchangeReceiptDialog";
import { format } from "date-fns";
import { useCancelExchange } from "@/services/sales/exchanges/ExchangeReactQueryService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";

interface ExchangesListProps {
  exchanges: ExchangeTransaction[];
  searchTerm?: string;
}

export function ExchangesList({ exchanges, searchTerm }: ExchangesListProps) {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeTransaction | null>(null);
  const [receiptExchange, setReceiptExchange] = useState<ExchangeTransaction | null>(null);
  const { userRole } = useAuth();
  const cancelExchange = useCancelExchange();

  const {
    paginatedData: paginatedMobileExchanges,
    currentPage: mobilePage,
    totalPages: mobileTotalPages,
    goToPage: mobileGoToPage
  } = usePagination({ data: exchanges, itemsPerPage: 17 });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Contanti',
      card: 'Carta',
      bank_transfer: 'Bonifico',
      hybrid: 'Ibrido'
    };
    return labels[method] || method;
  };

  const handleCancelExchange = async (exchange: ExchangeTransaction) => {
    if (exchange.status === 'cancelled') {
      toast.error("Questo cambio è già stato annullato");
      return;
    }

    if (window.confirm(`Sei sicuro di voler annullare il cambio #${exchange.exchange_number}?`)) {
      try {
        await cancelExchange.mutateAsync(exchange.id);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const columns = [
    {
      key: 'exchange_number' as keyof ExchangeTransaction,
      header: 'Cambio #',
      render: (value: string) => (
        <div className="font-mono font-medium text-sm whitespace-nowrap">#{value}</div>
      )
    },
    {
      key: 'client' as keyof ExchangeTransaction,
      header: 'Cliente',
      render: (value: any) => {
        if (!value) return <span className="text-muted-foreground text-sm">N/A</span>;
        const name = value.type === 'business' 
          ? value.company_name 
          : `${value.first_name || ''} ${value.last_name || ''}`.trim();
        return (
          <div className="text-sm truncate max-w-[150px]" title={name || 'N/A'}>
            {name || 'N/A'}
          </div>
        );
      }
    },
    {
      key: 'trade_in_items' as keyof ExchangeTransaction,
      header: 'Permuta',
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
      key: 'trade_in_total' as keyof ExchangeTransaction,
      header: 'Val. Permuta',
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-semibold text-sm text-green-600 whitespace-nowrap">
          €{value.toFixed(2)}
        </div>
      )
    },
    {
      key: 'purchase_total' as keyof ExchangeTransaction,
      header: 'Val. Acquisto',
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-semibold text-sm text-blue-600 whitespace-nowrap">
          €{value.toFixed(2)}
        </div>
      )
    },
    {
      key: 'net_difference' as keyof ExchangeTransaction,
      header: 'Differenza',
      align: 'right' as const,
      render: (value: number, exchange: ExchangeTransaction) => {
        const isPositive = value > 0;
        const isZero = Math.abs(value) < 0.01;
        return (
          <div className={`font-bold text-base whitespace-nowrap ${
            isZero ? 'text-muted-foreground' : isPositive ? 'text-primary' : 'text-orange-600'
          }`}>
            {isZero ? '€0.00' : `${isPositive ? '+' : ''}€${value.toFixed(2)}`}
          </div>
        );
      }
    },
    {
      key: 'payment_method' as keyof ExchangeTransaction,
      header: 'Pagamento',
      render: (value: string) => (
        <div className="text-sm capitalize">{getPaymentMethodLabel(value)}</div>
      )
    },
    {
      key: 'status' as keyof ExchangeTransaction,
      header: 'Stato',
      align: 'center' as const,
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value === 'completed' ? 'Completato' : 'Annullato'}
        </Badge>
      )
    },
    {
      key: 'exchange_date' as keyof ExchangeTransaction,
      header: 'Data',
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
      icon: <Printer className="h-4 w-4" />,
      label: "Stampa",
      onClick: (exchange: ExchangeTransaction) => setReceiptExchange(exchange),
      className: "hover:bg-green-50 hover:text-green-600"
    },
    {
      icon: <Eye className="h-4 w-4" />,
      label: "Dettagli",
      onClick: (exchange: ExchangeTransaction) => setSelectedExchange(exchange),
      className: "hover:bg-blue-50 hover:text-blue-600"
    },
    ...(userRole === 'admin' || userRole === 'super_admin' ? [
      {
        icon: <XCircle className="h-4 w-4" />,
        label: "Annulla",
        onClick: handleCancelExchange,
        variant: "destructive" as const,
        className: "hover:bg-red-50 hover:text-red-600"
      }
    ] : [])
  ];

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={exchanges}
          columns={columns}
          actions={actions}
          getRowKey={(exchange) => exchange.id}
          onRowClick={(exchange) => setSelectedExchange(exchange)}
        />
      </div>

      {/* Mobile & Tablet Card Layout */}
      <div className="lg:hidden space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {paginatedMobileExchanges.map((exchange) => (
            <DataCard
              key={exchange.id}
              title={`Cambio #${exchange.exchange_number}`}
              subtitle={exchange.salesperson_id ? `ID: ${exchange.salesperson_id.slice(0, 8)}` : "Unknown"}
              icon={<ArrowLeftRight className="h-5 w-5 text-primary" />}
              badge={{
                text: exchange.status === 'completed' ? 'Completato' : 'Annullato',
                variant: getStatusColor(exchange.status) as any
              }}
              onClick={() => setSelectedExchange(exchange)}
              fields={[
                {
                  label: "Cliente",
                  value: exchange.client
                    ? exchange.client.type === 'business'
                      ? exchange.client.company_name || 'N/A'
                      : `${exchange.client.first_name} ${exchange.client.last_name}`
                    : 'N/A'
                },
                {
                  label: "Articoli in Permuta",
                  value: `${exchange.trade_in_items?.length || 0} articoli`
                },
                {
                  label: "Valore Permuta",
                  value: `€${exchange.trade_in_total.toFixed(2)}`
                },
                {
                  label: "Valore Acquisto",
                  value: `€${exchange.purchase_total.toFixed(2)}`
                },
                {
                  label: "Differenza Netta",
                  value: `${exchange.net_difference > 0 ? '+' : ''}€${exchange.net_difference.toFixed(2)}`
                },
                {
                  label: "Metodo Pagamento",
                  value: getPaymentMethodLabel(exchange.payment_method)
                },
                {
                  label: "Data",
                  value: format(new Date(exchange.exchange_date), "dd/MM/yyyy HH:mm")
                }
              ]}
            />
          ))}
        </div>
      </div>

      {/* Exchange Details Dialog */}
      {selectedExchange && (
        <ExchangeDetailsDialog
          exchange={selectedExchange}
          open={!!selectedExchange}
          onClose={() => setSelectedExchange(null)}
        />
      )}

      {/* Exchange Receipt Dialog */}
      {receiptExchange && (
        <ExchangeReceiptDialog
          exchange={receiptExchange}
          open={!!receiptExchange}
          onOpenChange={(open) => !open && setReceiptExchange(null)}
        />
      )}
    </>
  );
}
