
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/updated-dialog";
import { Button } from "@/components/ui/updated-button";
import { Plus } from "lucide-react";
import { SaleReceiptDialog } from "./SaleReceiptDialog";
import { SaleFormContainer } from "./refactored/SaleFormContainer";
import { SalesPermissionGuard } from './SalesPermissionGuard';
import { useQueryClient } from '@tanstack/react-query';

interface NewSaleDialogProps {
  onSuccess?: () => void;
}

export function NewSaleDialog({ onSuccess }: NewSaleDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [createdSale, setCreatedSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const queryClient = useQueryClient();

  const handleSaleComplete = (sale: any) => {
    setCreatedSale(sale);
    setShowReceipt(true);
    setOpen(false);
    
    // Force immediate refresh
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.refetchQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };


  return (
    <SalesPermissionGuard requiredRole="create">
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full lg:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg font-bold py-6 px-8 min-h-[60px]">
          <Plus className="mr-3 h-7 w-7" />
          NUOVA GARENTILLE
        </Button>
      </DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crea Nuova Garentille</DialogTitle>
        </DialogHeader>
        
        <SaleFormContainer
          onSaleComplete={handleSaleComplete}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
      
      {/* Auto-show receipt dialog after sale creation */}
      {createdSale && showReceipt && (
        <SaleReceiptDialog 
          sale={createdSale}
          open={showReceipt}
          onOpenChange={setShowReceipt}
        />
      )}
      </Dialog>
    </SalesPermissionGuard>
  );
}
