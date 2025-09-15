import React, { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Package, User, CreditCard, Calendar } from "lucide-react";
import { useDeleteSale, type Sale } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface EnhancedDeleteDialogProps {
  sale: Sale;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EnhancedDeleteDialog({ sale, open, onClose, onSuccess }: EnhancedDeleteDialogProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteSale = useDeleteSale();

  // Only show for super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  const handleDelete = async () => {
    try {
      await deleteSale.mutateAsync(sale.id);
      
      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Inventory will be restored
      
      toast({
        title: "Sale deleted successfully",
        description: `Sale #${sale.sale_number} has been deleted and inventory restored.`,
      });
      
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Error deleting sale",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      case "refunded": return "outline";
      default: return "outline";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Sale
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The sale will be permanently deleted and any sold inventory will be restored.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Sale Details */}
        <div className="space-y-4 my-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Sale #{sale.sale_number}</span>
                  <Badge variant={getStatusColor(sale.status)}>
                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {sale.client 
                        ? (sale.client.type === 'individual' 
                            ? `${sale.client.first_name} ${sale.client.last_name}`
                            : sale.client.company_name)
                        : 'No client assigned'
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(sale.sale_date), "dd/MM/yyyy")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{sale.sale_items?.length || 0} items</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-lg">€{sale.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Impact of deletion:</p>
                <ul className="mt-1 text-amber-700 space-y-1">
                  <li>• Sale record will be permanently deleted</li>
                  <li>• Sold inventory will be automatically restored</li>
                  <li>• Product units will return to available status</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteSale.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteSale.isPending ? "Deleting..." : "Delete Sale"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}