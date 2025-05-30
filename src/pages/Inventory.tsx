
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
    <div className="space-y-6">
      <InventoryHeader onToggleSettings={handleToggleSettings} />
      
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
