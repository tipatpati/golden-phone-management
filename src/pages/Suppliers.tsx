import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { NewSupplierDialog } from "@/components/suppliers/NewSupplierDialog";
import { TransactionsTable } from "@/components/suppliers/TransactionsTable";
import { NewTransactionDialog } from "@/components/suppliers/NewTransactionDialog";
import { Search, Plus, Building2, Receipt, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [isContactingSuppliers, setIsContactingSuppliers] = useState(false);

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
    <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage suppliers and track transactions</p>
        </div>
      </div>

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
                    variant="outline"
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
              <SuppliersTable searchTerm={searchTerm} />
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-xs sm:max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
              <TransactionsTable searchTerm={searchTerm} />
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
    </div>
  );
};

export default Suppliers;