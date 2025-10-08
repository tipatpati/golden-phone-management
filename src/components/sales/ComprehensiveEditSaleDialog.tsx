import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/updated-dialog";
import { Button } from "@/components/ui/updated-button";
import { Edit } from "lucide-react";
import { SaleFormContainer } from "./refactored/SaleFormContainer";
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { SaleCreationProvider } from '@/contexts/SaleCreationContext';
import type { Sale } from '@/services';

interface ComprehensiveEditSaleDialogProps {
  sale: Sale;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ComprehensiveEditSaleDialog({ sale, onSuccess, trigger }: ComprehensiveEditSaleDialogProps) {
  const { userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Only show for super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  const handleSaleComplete = (updatedSale: any) => {
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

  const defaultTrigger = (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 hover:bg-amber-50 hover:text-amber-600 transition-colors"
      onClick={() => setOpen(true)}
    >
      <Edit className="h-4 w-4" />
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Modifica Garentille - {sale.sale_number}
            </DialogTitle>
          </DialogHeader>
          
          <SaleFormContainer
            onSaleComplete={handleSaleComplete}
            onCancel={() => setOpen(false)}
            isEditMode={true}
            editingSaleId={sale.id}
            initialSale={sale}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
