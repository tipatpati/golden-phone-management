import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/common/FormDialog";
import { FormField } from "@/components/common/FormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Calendar, CreditCard, FileText } from "lucide-react";
import { useUpdateSale, type Sale } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { SimpleClientSelector } from "@/components/sales/SimpleClientSelector";

interface BulkEditSaleDialogProps {
  selectedSales: Sale[];
  onSuccess?: () => void;
  onClose?: () => void;
  open: boolean;
}

interface BulkEditFields {
  status?: string;
  paymentMethod?: string;
  clientId?: string;
  notes?: string;
  addNotes?: boolean; // Whether to append or replace notes
}

export function BulkEditSaleDialog({ selectedSales, onSuccess, onClose, open }: BulkEditSaleDialogProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateSale = useUpdateSale();

  const [fields, setFields] = useState<BulkEditFields>({});
  const [enabledFields, setEnabledFields] = useState({
    status: false,
    paymentMethod: false,
    clientId: false,
    notes: false
  });

  // Only show for super admins
  if (userRole !== 'super_admin' || selectedSales.length === 0) {
    return null;
  }

  const handleSubmit = async () => {
    try {
      const updates: Array<{ id: string; data: any }> = [];

      selectedSales.forEach(sale => {
        const updateData: any = {};
        
        if (enabledFields.status && fields.status) {
          updateData.status = fields.status;
        }
        
        if (enabledFields.paymentMethod && fields.paymentMethod) {
          updateData.payment_method = fields.paymentMethod;
        }
        
        if (enabledFields.clientId && fields.clientId) {
          updateData.client_id = fields.clientId;
        }
        
        if (enabledFields.notes && fields.notes) {
          if (fields.addNotes) {
            // Append to existing notes
            updateData.notes = sale.notes ? `${sale.notes}\n${fields.notes}` : fields.notes;
          } else {
            // Replace notes
            updateData.notes = fields.notes;
          }
        }

        if (Object.keys(updateData).length > 0) {
          updates.push({ id: sale.id, data: updateData });
        }
      });

      if (updates.length === 0) {
        toast({
          title: "No changes to apply",
          description: "Please enable at least one field to update.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Updating sales...",
        description: `Updating ${updates.length} sales...`,
      });

      // Update sales one by one
      for (const update of updates) {
        await updateSale.mutateAsync(update);
      }
      
      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      
      toast({
        title: "Bulk update completed",
        description: `Successfully updated ${updates.length} sales.`,
      });
      
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast({
        title: "Error updating sales",
        description: "Some sales could not be updated. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleField = (field: keyof typeof enabledFields) => {
    setEnabledFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateField = (field: keyof BulkEditFields, value: any) => {
    setFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <FormDialog
      title={`Bulk Edit ${selectedSales.length} Sales`}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={updateSale.isPending}
      submitText={updateSale.isPending ? "Updating..." : "Update All"}
      size="md"
    >
      <div className="space-y-6">
        {/* Selected Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selected Sales ({selectedSales.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedSales.map(sale => (
                <Badge key={sale.id} variant="outline" className="text-xs">
                  #{sale.sale_number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Edit Fields */}
        <div className="space-y-4">
          {/* Status Update */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  checked={enabledFields.status}
                  onCheckedChange={() => toggleField('status')}
                />
                <label className="text-sm font-medium">Update Status</label>
              </div>
              {enabledFields.status && (
                <FormField
                  label="New Status"
                  type="select"
                  value={fields.status || ""}
                  onChange={(value) => updateField('status', value)}
                  options={[
                    { value: "completed", label: "Completed" },
                    { value: "pending", label: "Pending" },
                    { value: "cancelled", label: "Cancelled" },
                    { value: "refunded", label: "Refunded" }
                  ]}
                />
              )}
            </CardContent>
          </Card>

          {/* Payment Method Update */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  checked={enabledFields.paymentMethod}
                  onCheckedChange={() => toggleField('paymentMethod')}
                />
                <label className="text-sm font-medium">Update Payment Method</label>
              </div>
              {enabledFields.paymentMethod && (
                <FormField
                  label="New Payment Method"
                  type="select"
                  value={fields.paymentMethod || ""}
                  onChange={(value) => updateField('paymentMethod', value)}
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "bank_transfer", label: "Bank Transfer" },
                    { value: "hybrid", label: "Hybrid" },
                    { value: "other", label: "Other" }
                  ]}
                />
              )}
            </CardContent>
          </Card>

          {/* Client Reassignment */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  checked={enabledFields.clientId}
                  onCheckedChange={() => toggleField('clientId')}
                />
                <label className="text-sm font-medium">Reassign Client</label>
              </div>
              {enabledFields.clientId && (
                <SimpleClientSelector
                  value={fields.clientId || ""}
                  onChange={(value) => updateField('clientId', value)}
                  placeholder="Select new client..."
                />
              )}
            </CardContent>
          </Card>

          {/* Notes Update */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  checked={enabledFields.notes}
                  onCheckedChange={() => toggleField('notes')}
                />
                <label className="text-sm font-medium">Update Notes</label>
              </div>
              {enabledFields.notes && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={fields.addNotes || false}
                      onCheckedChange={(checked) => updateField('addNotes', checked)}
                    />
                    <label className="text-sm">Append to existing notes (otherwise replace)</label>
                  </div>
                  <FormField
                    label="Notes"
                    type="textarea"
                    value={fields.notes || ""}
                    onChange={(value) => updateField('notes', value)}
                    placeholder="Enter notes to add or replace..."
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {Object.values(enabledFields).some(Boolean) && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">Changes to apply:</h4>
              <ul className="text-sm space-y-1">
                {enabledFields.status && <li>• Status → {fields.status}</li>}
                {enabledFields.paymentMethod && <li>• Payment Method → {fields.paymentMethod}</li>}
                {enabledFields.clientId && <li>• Client → {fields.clientId ? "Reassign" : "Clear"}</li>}
                {enabledFields.notes && <li>• Notes → {fields.addNotes ? "Append" : "Replace"}</li>}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                These changes will be applied to {selectedSales.length} selected sales.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </FormDialog>
  );
}