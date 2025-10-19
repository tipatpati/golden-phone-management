import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { 
  Printer, 
  Package, 
  Building2, 
  Calendar, 
  FileText, 
  Euro, 
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  Info,
  Phone,
  Mail,
  MapPin,
  Hash,
  CreditCard,
  ShoppingCart
} from "lucide-react";
import { SupplierAcquisitionPrintDialog } from "./dialogs/SupplierAcquisitionPrintDialog";
import { useSupplierTransactionItems } from "@/services/suppliers/SupplierTransactionService";

interface SupplierTransaction {
  id: string;
  transaction_number: string;
  type: string;
  status: string;
  total_amount: number;
  transaction_date: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  supplier_id?: string;
  suppliers?: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
    tax_id?: string;
    payment_terms?: string;
    credit_limit?: number;
    status?: string;
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
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch transaction items
  const { data: transactionItems, isLoading: itemsLoading } = useSupplierTransactionItems(
    transaction?.id || ""
  );
  
  if (!transaction) return null;

  const canPrintLabels = transaction.type === "purchase" && transaction.status === "completed";
  
  // Calculate financial breakdown
  const itemsTotal = transactionItems?.reduce((sum, item) => sum + item.total_cost, 0) || 0;
  const itemsCount = transactionItems?.length || 0;
  const avgItemCost = itemsCount > 0 ? itemsTotal / itemsCount : 0;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transaction Details - {transaction.transaction_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items ({itemsCount})
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Supplier
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="space-y-6 h-full overflow-auto">
              {/* Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Total Amount
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(transaction.total_amount)}</div>
                    <p className="text-xs text-muted-foreground">
                      {itemsCount} item{itemsCount !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Badge className={cn("p-1", getTypeColor(transaction.type))}>
                        <span className="text-xs">{transaction.type}</span>
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={cn("text-sm", getStatusColor(transaction.status))}>
                      {transaction.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(transaction.transaction_date))} ago
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Average Item Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold">{formatCurrency(avgItemCost)}</div>
                    <p className="text-xs text-muted-foreground">per item</p>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Transaction Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transaction Number</label>
                      <p className="font-mono text-sm">{transaction.transaction_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transaction Date</label>
                      <p className="text-sm">{format(new Date(transaction.transaction_date), "EEEE, MMMM dd, yyyy 'at' HH:mm")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <div className="mt-1">
                        <Badge className={cn("text-xs", getTypeColor(transaction.type))}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={cn("text-xs", getStatusColor(transaction.status))}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {transaction.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <div className="bg-muted/30 rounded-md p-3 mt-1">
                        <p className="text-sm">{transaction.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technical Details Collapsible */}
              <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Technical Details
                        </div>
                        {showTechnicalDetails ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-muted-foreground">Transaction ID</label>
                          <p className="font-mono text-xs break-all">{transaction.id}</p>
                        </div>
                        {transaction.supplier_id && (
                          <div>
                            <label className="font-medium text-muted-foreground">Supplier ID</label>
                            <p className="font-mono text-xs break-all">{transaction.supplier_id}</p>
                          </div>
                        )}
                        {transaction.created_at && (
                          <div>
                            <label className="font-medium text-muted-foreground">Created At</label>
                            <p className="text-xs">{format(new Date(transaction.created_at), "MMM dd, yyyy HH:mm:ss")}</p>
                          </div>
                        )}
                        {transaction.updated_at && (
                          <div>
                            <label className="font-medium text-muted-foreground">Last Updated</label>
                            <p className="text-xs">{format(new Date(transaction.updated_at), "MMM dd, yyyy HH:mm:ss")}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="items" className="h-full overflow-auto">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Transaction Items
                  </CardTitle>
                  <CardDescription>
                    {itemsLoading ? 'Loading items...' : `${itemsCount} item${itemsCount !== 1 ? 's' : ''} in this transaction`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {itemsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : transactionItems && transactionItems.length > 0 ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {transactionItems.map((item) => (
                          <Card key={item.id} className="border-l-4 border-l-primary/20">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {item.products?.brand} {item.products?.model}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                                    <div>
                                      <span className="font-medium">Quantity:</span> {item.quantity}
                                    </div>
                                    <div>
                                      <span className="font-medium">Unit Cost:</span> {formatCurrency(item.unit_cost)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Total Cost:</span> {formatCurrency(item.total_cost)}
                                    </div>
                                    {item._enrichedUnits && item._enrichedUnits.length > 0 && (
                                      <div className="col-span-2">
                                        <span className="font-medium">Unit Details:</span>
                                        <div className="mt-2 space-y-3">
                                          {item._enrichedUnits.map((unit, idx) => (
                                            <Card key={unit.id} className="bg-muted/30">
                                              <CardContent className="p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-xs font-medium text-muted-foreground">Unit {idx + 1}</span>
                                                  {unit.serial_number && (
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                      {unit.serial_number}
                                                    </Badge>
                                                  )}
                                                </div>
                                                {unit.barcode && (
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">Barcode:</span>
                                                    <Badge variant="secondary" className="text-xs font-mono">
                                                      {unit.barcode}
                                                    </Badge>
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold">{formatCurrency(item.total_cost)}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No items found for this transaction
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="supplier" className="h-full overflow-auto">
              {transaction.suppliers ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Supplier Information
                    </CardTitle>
                    <CardDescription>Complete supplier details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">{transaction.suppliers.name}</h3>
                      {transaction.suppliers.contact_person && (
                        <p className="text-muted-foreground">Contact: {transaction.suppliers.contact_person}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-muted-foreground">Contact Information</h4>
                        {transaction.suppliers.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{transaction.suppliers.email}</span>
                          </div>
                        )}
                        {transaction.suppliers.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{transaction.suppliers.phone}</span>
                          </div>
                        )}
                        {transaction.suppliers.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm">{transaction.suppliers.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-muted-foreground">Business Information</h4>
                        {transaction.suppliers.tax_id && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                            <p className="text-sm">{transaction.suppliers.tax_id}</p>
                          </div>
                        )}
                        {transaction.suppliers.payment_terms && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                            <p className="text-sm">{transaction.suppliers.payment_terms}</p>
                          </div>
                        )}
                        {transaction.suppliers.credit_limit && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Credit Limit</label>
                            <p className="text-sm">{formatCurrency(transaction.suppliers.credit_limit)}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <div className="mt-1">
                            <Badge variant={transaction.suppliers.status === 'active' ? 'default' : 'secondary'}>
                              {transaction.suppliers.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      No supplier information available
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="h-full overflow-auto">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Transaction Timeline
                  </CardTitle>
                  <CardDescription>Important dates and time information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Transaction Date</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.transaction_date), "EEEE, MMMM dd, yyyy 'at' HH:mm")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.transaction_date))} ago
                        </p>
                      </div>
                    </div>

                    {transaction.created_at && (
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Created</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), "EEEE, MMMM dd, yyyy 'at' HH:mm:ss")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.created_at))} ago
                          </p>
                        </div>
                      </div>
                    )}

                    {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Last Updated</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.updated_at), "EEEE, MMMM dd, yyyy 'at' HH:mm:ss")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.updated_at))} ago
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {transaction.created_at && (
                    <>
                      <Separator />

                      <div>
                        <h4 className="font-medium mb-4">Time Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                  {Math.abs(new Date(transaction.transaction_date).getTime() - new Date(transaction.created_at).getTime()) / (1000 * 60 * 60 * 24) < 1 
                                    ? '< 1' 
                                    : Math.round(Math.abs(new Date(transaction.transaction_date).getTime() - new Date(transaction.created_at).getTime()) / (1000 * 60 * 60 * 24))
                                  }
                                </div>
                                <p className="text-sm text-muted-foreground">Days between creation and transaction date</p>
                              </div>
                            </CardContent>
                          </Card>
                          {transaction.updated_at && (
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {Math.abs(new Date(transaction.updated_at).getTime() - new Date(transaction.created_at).getTime()) / (1000 * 60) < 1 
                                      ? '< 1' 
                                      : Math.round(Math.abs(new Date(transaction.updated_at).getTime() - new Date(transaction.created_at).getTime()) / (1000 * 60))
                                    }
                                  </div>
                                  <p className="text-sm text-muted-foreground">Minutes to last update</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {canPrintLabels && (
          <DialogFooter className="border-t pt-4">
            <Button 
              onClick={() => setShowPrintDialog(true)}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
      
      <SupplierAcquisitionPrintDialog
        transactions={[transaction]}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
      />
    </Dialog>
  );
}