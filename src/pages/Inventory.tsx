
import React, { useState } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTableToolbar } from "@/components/inventory/InventoryTableToolbar";
import { AddProductForm } from "@/components/inventory/AddProductForm";
import { Barcode, PackageSearch } from "lucide-react";

const Inventory = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <PackageSearch className="h-8 w-8" />
          Inventory Management
        </h2>
        <p className="text-muted-foreground">
          Manage your phone products, accessories, and keep track of stock levels.
        </p>
      </div>
      
      {showAddProduct ? (
        <div className="bg-muted/50 p-4 rounded-lg">
          <AddProductForm onCancel={() => setShowAddProduct(false)} />
        </div>
      ) : (
        <>
          <InventoryTableToolbar onAddProduct={() => setShowAddProduct(true)} />
          <InventoryTable />

          <div className="mt-4 flex items-center justify-center p-4 border border-dashed rounded-lg">
            <div className="flex flex-col items-center text-center max-w-md p-4">
              <Barcode className="h-10 w-10 mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium">Barcode Scanner Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect a barcode scanner to quickly add or search for products.
                Simply focus on any search field and scan the barcode.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
