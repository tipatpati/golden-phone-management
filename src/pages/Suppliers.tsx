import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { NotificationCenter } from "@/components/suppliers/NotificationCenter";
import { NewSupplierDialog } from "@/components/suppliers/NewSupplierDialog";
import { TransactionsTable } from "@/components/suppliers/TransactionsTable";
import { NewTransactionDialog } from "@/components/suppliers/NewTransactionDialog";
import { OrphanedUnitsRecoveryDialog } from "@/components/suppliers/OrphanedUnitsRecoveryDialog";
import { Plus, Building2, Receipt, Mail, Loader2, ShoppingCart, Package2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { AcquisitionForm } from "@/components/suppliers/AcquisitionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

const Suppliers = () => {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showAcquisitionDialog, setShowAcquisitionDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [isContactingSuppliers, setIsContactingSuppliers] = useState(false);

  // Enable real-time updates
  useRealtimeTransactions();

  const handleSearch = () => {
    setActiveSearchQuery(localSearchQuery);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    setActiveSearchQuery('');
  };

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
          <TabsTrigger value="suppliers" className="flex items-center gap-2 p-3 sm:p-4 min-h-12">
            <Building2 className="h-4 w-4" />
            <span>Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2 p-3 sm:p-4 min-h-12">
            <Receipt className="h-4 w-4" />
            <span>Transactions</span>
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
              <div className="flex items-center gap-2">
                <SearchBar
                  value={localSearchQuery}
                  onChange={setLocalSearchQuery}
                  placeholder="Search suppliers..."
                  className="flex-1 max-w-xs sm:max-w-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button onClick={handleSearch} variant="filled" className="h-12">
                  <span className="hidden sm:inline">Cerca</span>
                  <span className="sm:hidden">Cerca</span>
                </Button>
                {localSearchQuery && (
                  <Button onClick={handleClearSearch} variant="outlined" className="h-12">
                    <span className="hidden sm:inline">Cancella</span>
                    <span className="sm:hidden">×</span>
                  </Button>
                )}
              </div>
              <SuppliersTable searchTerm={activeSearchQuery} />
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
              <TransactionsTable />
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
        <DialogContent className="w-[95vw] sm:w-full max-w-7xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Supplier Acquisition</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
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