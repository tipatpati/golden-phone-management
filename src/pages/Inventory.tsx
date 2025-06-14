
import React from "react";
import { ApiSettings } from "@/components/inventory/ApiSettings";
import { ConnectionStatus } from "@/components/inventory/ConnectionStatus";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryContent } from "@/components/inventory/InventoryContent";
import { useInventoryState } from "@/hooks/useInventoryState";

const Inventory = () => {
  const {
    showAddProduct,
    showSettings,
    canAddProducts,
    isCheckingConnection,
    handleAddProduct,
    handleToggleSettings,
    handleCloseSettings,
    handleCancelAddProduct,
    handleTestConnection
  } = useInventoryState();

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
        <InventoryHeader onToggleSettings={handleToggleSettings} />
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <ApiSettings 
          onClose={handleCloseSettings}
          onConnectionTest={handleTestConnection}
        />
      )}
      
      {/* API Connection Status */}
      <ConnectionStatus 
        canAddProducts={canAddProducts}
        isCheckingConnection={isCheckingConnection}
        onShowSettings={handleToggleSettings}
        onTestConnection={handleTestConnection}
      />
      
      <InventoryContent
        showAddProduct={showAddProduct}
        onAddProduct={handleAddProduct}
        onCancelAddProduct={handleCancelAddProduct}
      />
    </div>
  );
};

export default Inventory;
