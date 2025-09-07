
import React from "react";
import { ConnectionStatus } from "@/components/inventory/ConnectionStatus";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryContent } from "@/components/inventory/InventoryContent";
import { useInventoryState } from "@/hooks/useInventoryState";
import AdminPurgeProducts from "@/components/inventory/admin/AdminPurgeProducts";
import { InventoryIntegrityDashboard } from "@/components/inventory/admin/InventoryIntegrityDashboard";

const Inventory = () => {
  const {
    showAddProduct,
    canAddProducts,
    isCheckingConnection,
    handleAddProduct,
    handleCancelAddProduct,
    handleTestConnection
  } = useInventoryState();

  return (
    <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-3 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 border-0">
        <InventoryHeader />
      </div>
      
      {/* API Connection Status */}
      <ConnectionStatus 
        canAddProducts={canAddProducts}
        isCheckingConnection={isCheckingConnection}
        onTestConnection={handleTestConnection}
      />

      {/* Admin purge tool */}
      <AdminPurgeProducts />
      
      {/* Data Integrity Dashboard */}
      <InventoryIntegrityDashboard />
      
      <InventoryContent
        showAddProduct={showAddProduct}
        onAddProduct={handleAddProduct}
        onCancelAddProduct={handleCancelAddProduct}
      />
    </div>
  );
};

export default Inventory;
