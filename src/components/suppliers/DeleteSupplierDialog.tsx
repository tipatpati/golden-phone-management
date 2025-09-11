import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteSupplier } from "@/services";

interface DeleteSupplierDialogProps {
  supplier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSupplierDialog({ supplier, open, onOpenChange }: DeleteSupplierDialogProps) {
  const { toast } = useToast();
  const deleteSupplier = useDeleteSupplier();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!supplier) return;

    setIsDeleting(true);
    try {
      await deleteSupplier.mutateAsync(supplier.id);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Delete supplier error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Supplier
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the supplier and remove all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h4 className="font-medium">{supplier.name}</h4>
            {supplier.contact_person && (
              <p className="text-sm text-muted-foreground">
                Contact: {supplier.contact_person}
              </p>
            )}
            {supplier.email && (
              <p className="text-sm text-muted-foreground">
                Email: {supplier.email}
              </p>
            )}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> Suppliers with existing transactions cannot be deleted to maintain data integrity. 
            Consider deactivating the supplier instead to preserve historical data while preventing new transactions.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Supplier"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}