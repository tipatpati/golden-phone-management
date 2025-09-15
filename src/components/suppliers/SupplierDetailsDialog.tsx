import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  FileText,
  Edit,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Euro
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SuppliersApiService } from "@/services/suppliers/SuppliersApiService";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from "@/services/suppliers/types";

interface SupplierDetailsDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (supplier: Supplier) => void;
  onToggleStatus?: (supplier: Supplier) => void;
}

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

const suppliersApi = new SuppliersApiService();

export function SupplierDetailsDialog({
  supplier,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus
}: SupplierDetailsDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const { toast } = useToast();

  // Fetch supplier statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['supplier-stats', supplier?.id],
    queryFn: () => supplier ? suppliersApi.getSupplierStats(supplier.id) : null,
    enabled: !!supplier?.id && open,
  });

  const handleToggleStatus = async () => {
    if (!supplier) return;
    
    setIsTogglingStatus(true);
    try {
      await suppliersApi.toggleStatus(supplier.id);
      toast({
        title: "Success",
        description: `Supplier ${supplier.status === 'active' ? 'deactivated' : 'activated'} successfully`,
      });
      onToggleStatus?.(supplier);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update supplier status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (!supplier) return null;

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Supplier Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information for {supplier.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Main Supplier Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{supplier.name}</CardTitle>
                    {supplier.contact_person && (
                      <div className="text-sm text-muted-foreground">
                        Contact: {supplier.contact_person}
                      </div>
                    )}
                    <Badge variant={getStatusColor(supplier.status)}>
                      {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(supplier.credit_limit || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Credit Limit</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <a 
                        href={`mailto:${supplier.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <a 
                        href={`tel:${supplier.phone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-muted-foreground">Address:</span>
                      <div className="text-sm text-right max-w-[200px]">
                        {supplier.address}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.tax_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tax ID:</span>
                      <span className="text-sm font-mono">{supplier.tax_id}</span>
                    </div>
                  )}
                  {supplier.payment_terms && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Terms:</span>
                      <span className="text-sm">{supplier.payment_terms}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Credit Limit:</span>
                    <span className="text-sm font-medium">{formatCurrency(supplier.credit_limit || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Statistics */}
            {stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Transaction Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total_transactions}</div>
                      <div className="text-xs text-muted-foreground">Total Transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_amount)}</div>
                      <div className="text-xs text-muted-foreground">Total Amount</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending_amount)}</div>
                      <div className="text-xs text-muted-foreground">Pending Amount</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {stats.last_transaction_date ? formatDate(stats.last_transaction_date) : 'Never'}
                      </div>
                      <div className="text-xs text-muted-foreground">Last Transaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {supplier.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {supplier.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Record Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(supplier.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{formatDate(supplier.updated_at)}</span>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                className="flex items-center gap-2"
              >
                {supplier.status === 'active' ? (
                  <ToggleLeft className="h-4 w-4" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
                {isTogglingStatus 
                  ? "Updating..." 
                  : supplier.status === 'active' 
                    ? "Deactivate" 
                    : "Activate"
                }
              </Button>
              <Button onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Supplier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditSupplierDialog
        supplier={supplier}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}