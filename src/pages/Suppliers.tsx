import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/updated-card";
import { Button } from "@/components/ui/updated-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { NotificationCenter } from "@/components/suppliers/NotificationCenter";

import { NewSupplierDialog } from "@/components/suppliers/NewSupplierDialog";
import { TransactionsTable } from "@/components/suppliers/TransactionsTable";
import { NewTransactionDialog } from "@/components/suppliers/NewTransactionDialog";
import { OrphanedUnitsRecoveryDialog } from "@/components/suppliers/OrphanedUnitsRecoveryDialog";
import { Search, Plus, Building2, Receipt, Mail, Loader2, ShoppingCart, Package2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { AcquisitionForm } from "@/components/suppliers/AcquisitionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/updated-dialog";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { useSupplierTransactionSearch } from "@/hooks/useSupplierTransactionSearch";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

const Suppliers = () => {
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showAcquisitionDialog, setShowAcquisitionDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [isContactingSuppliers, setIsContactingSuppliers] = useState(false);

  // Enable real-time updates
  useRealtimeTransactions();

  // Search state for transactions
  const {
    searchQuery,
    searchTrigger,
    isSearching,
    executeSearch,
    clearSearch,
    completeSearch,
  } = useSupplierTransactionSearch();

  const handleContactAllSuppliers = async () => {
    setIsContactingSuppliers(true);
    try {
      const { data, error } = await supabase.functions.invoke('contact-suppliers', {
        body: { type: 'lowstock' }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to contact suppliers");
      }
    } catch (error: any) {
      console.error("Error contacting suppliers:", error);
      toast.error("Failed to contact suppliers. Please try again.");
    } finally {
      setIsContactingSuppliers(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader 
        title="Suppliers"
        subtitle="Manage suppliers and track transactions"
        actions={<NotificationCenter />}
      />

      <ModuleNavCards currentModule="suppliers" />

      <Tabs defaultValue="suppliers" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="suppliers" className="flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Suppliers</span>
            <span className="sm:hidden">Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
            <span className="sm:hidden">Transactions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Building2 className="h-5 w-5" />
                  Supplier Management
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleContactAllSuppliers}
                    variant="outlined"
                    disabled={isContactingSuppliers}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    {isContactingSuppliers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {isContactingSuppliers ? "Contacting..." : "Contact Low Stock"}
                    </span>
                    <span className="sm:hidden">
                      {isContactingSuppliers ? "..." : "Contact"}
                    </span>
                  </Button>
                  <Button 
                    onClick={() => setShowNewSupplier(true)}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Supplier</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-xs sm:max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
              <SuppliersTable searchTerm={globalSearchTerm} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Receipt className="h-5 w-5" />
                  Transaction History
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outlined"
                    onClick={() => setShowAcquisitionDialog(true)}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">New Acquisition</span>
                    <span className="sm:hidden">Acquire</span>
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => setShowRecoveryDialog(true)}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Package2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Recover Units</span>
                    <span className="sm:hidden">Recover</span>
                  </Button>
                  <Button 
                    onClick={() => setShowNewTransaction(true)}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Transaction</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-xs sm:max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by transaction #, supplier, product, IMEI/SN, barcode..."
                    value={searchQuery}
                    onChange={(e) => {
                      if (!e.target.value.trim()) {
                        clearSearch();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        executeSearch(target.value);
                      }
                    }}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
              <TransactionsTable 
                searchQuery={searchQuery}
                searchTrigger={searchTrigger}
                isSearching={isSearching}
                completeSearch={completeSearch}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewSupplierDialog
        open={showNewSupplier}
        onOpenChange={setShowNewSupplier}
      />

      <NewTransactionDialog
        open={showNewTransaction}
        onOpenChange={setShowNewTransaction}
      />

      <Dialog open={showAcquisitionDialog} onOpenChange={setShowAcquisitionDialog}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Supplier Acquisition</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <AcquisitionForm
              onSuccess={() => {
                setShowAcquisitionDialog(false);
                toast.success('Acquisition completed successfully');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <OrphanedUnitsRecoveryDialog
        open={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
        onSuccess={() => {
          setShowRecoveryDialog(false);
          toast.success('Units recovered successfully');
        }}
      />

    </PageLayout>
  );
};

export default Suppliers;