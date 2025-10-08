
import React from "react";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryContent } from "@/components/inventory/InventoryContent";
import { useInventoryState } from "@/hooks/useInventoryState";
import { InventoryIntegrityDashboard } from "@/components/inventory/admin/InventoryIntegrityDashboard";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

const Inventory = () => {
  const {
    showAddProduct,
    handleAddProduct,
    handleCancelAddProduct
  } = useInventoryState();

  return (
    <PageLayout>
      <InventoryHeader />
      
      {/* Quick Navigation */}
      <ModuleNavCards currentModule="inventory" />
      
      {/* Data Integrity Dashboard */}
      <InventoryIntegrityDashboard />
      
      <InventoryContent
        showAddProduct={showAddProduct}
        onAddProduct={handleAddProduct}
        onCancelAddProduct={handleCancelAddProduct}
      />
    </PageLayout>
  );
};

export default Inventory;
