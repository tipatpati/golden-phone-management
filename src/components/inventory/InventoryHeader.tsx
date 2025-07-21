
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackageSearch, Settings, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductImportDialog } from "./ProductImportDialog";
import { ProductExportDialog } from "./ProductExportDialog";

export function InventoryHeader() {
  const [isContacting, setIsContacting] = useState(false);
  const { toast } = useToast();

  const handleContactSuppliers = async () => {
    setIsContacting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: "Authentication required",
          description: "Please log in to contact suppliers",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('contact-suppliers', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Suppliers contacted successfully",
          description: `${data.contactedSuppliers.length} suppliers were notified about ${data.lowStockItems} low stock items`,
        });
      } else {
        throw new Error(data.error || "Failed to contact suppliers");
      }
    } catch (error: any) {
      console.error("Error contacting suppliers:", error);
      toast({
        title: "Error contacting suppliers",
        description: error.message || "Failed to send notifications to suppliers",
        variant: "destructive",
      });
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6 w-full">
      <div className="flex-1 min-w-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
          <PackageSearch className="h-6 w-6 lg:h-8 lg:w-8 flex-shrink-0 text-primary" />
          <span className="truncate">Gestione Inventario</span>
        </h2>
        <p className="text-muted-foreground text-sm lg:text-base">
          Gestisci i tuoi prodotti, accessori e tieni traccia dei livelli di scorte.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <div className="flex gap-2">
          <ProductExportDialog />
          <ProductImportDialog />
        </div>
        
        <Button
          onClick={handleContactSuppliers}
          disabled={isContacting}
          variant="outline"
          size="sm"
          className="flex items-center justify-center gap-2 min-w-fit"
        >
          {isContacting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          <span className="whitespace-nowrap">
            {isContacting ? "Contacting..." : "Contact Suppliers"}
          </span>
        </Button>
      </div>
    </div>
  );
}
