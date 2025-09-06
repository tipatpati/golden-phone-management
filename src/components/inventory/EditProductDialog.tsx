import React, { useState, useEffect } from "react";
import { FormDialog } from "@/components/common/FormDialog";
import { ProductForm } from "./forms/ProductForm";
import { useUpdateProduct } from "@/services/products/ProductReactQueryService";
import { Product } from "@/services/products/types";
import { ProductFormData, UnitEntryForm } from "./forms/types";
import { ProductUnitsService } from "@/services/products/productUnitsService";
import { toast } from "@/components/ui/sonner";
import { log } from "@/utils/logger";

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductDialog({ 
  product, 
  open, 
  onClose, 
  onSuccess 
}: EditProductDialogProps) {
  log.debug('EditProductDialog rendering', { productId: product.id }, 'EditProductDialog');
  
  const [initialData, setInitialData] = useState<Partial<ProductFormData> | null>(null);
  const updateProduct = useUpdateProduct();
  const initialSerialCount = product.serial_numbers?.length || 0;

  // Load existing product units and prepare initial data
  useEffect(() => {
    const loadProductData = async () => {
      try {
        let unitEntries: UnitEntryForm[] = [];
        
        // If product has serial numbers, fetch the existing units
        if (product.has_serial && product.serial_numbers && product.serial_numbers.length > 0) {
          const existingUnits = await ProductUnitsService.getUnitsForProduct(product.id);
          console.log('📦 Loaded existing units for edit:', existingUnits);
          
          // Convert existing units to UnitEntryForm format
          unitEntries = existingUnits.map(unit => ({
            serial: unit.serial_number,
            price: unit.price,
            min_price: unit.min_price,
            max_price: unit.max_price,
            battery_level: unit.battery_level,
            color: unit.color,
            storage: unit.storage,
            ram: unit.ram,
          }));
          
          // If no units exist but serial numbers do, create basic entries
          if (unitEntries.length === 0 && product.serial_numbers) {
            unitEntries = product.serial_numbers.map(serial => ({
              serial,
              battery_level: 0,
            }));
          }
        }
        
        const preparedData: Partial<ProductFormData> = {
          brand: product.brand || "",
          model: product.model || "",
          year: product.year,
          category_id: product.category_id,
          price: product.price,
          min_price: product.min_price,
          max_price: product.max_price,
          stock: product.stock,
          threshold: product.threshold,
          description: product.description || "",
          supplier: product.supplier || "",
          barcode: product.barcode || "",
          has_serial: product.has_serial || false,
          serial_numbers: product.serial_numbers || [],
          unit_entries: unitEntries,
        };
        
        console.log('📝 Prepared initial data for edit:', {
          productId: product.id,
          unitEntriesCount: unitEntries.length,
          hasSerial: product.has_serial,
          unitEntries: unitEntries
        });
        
        setInitialData(preparedData);
      } catch (error) {
        console.error('Failed to load product units for edit:', error);
        // Fallback to basic data without units
        setInitialData({
          brand: product.brand || "",
          model: product.model || "",
          year: product.year,
          category_id: product.category_id,
          price: product.price,
          min_price: product.min_price,
          max_price: product.max_price,
          stock: product.stock,
          threshold: product.threshold,
          description: product.description || "",
          supplier: product.supplier || "",
          barcode: product.barcode || "",
          has_serial: product.has_serial || false,
          serial_numbers: product.serial_numbers || [],
          unit_entries: [],
        });
      }
    };
    
    if (open) {
      loadProductData();
    }
  }, [product, open]);

  const handleSubmit = async (data: ProductFormData) => {
    console.log('🔄 EditProductDialog handleSubmit called with data:', data);
    log.debug('Submitting product update', { 
      brand: data.brand, 
      model: data.model, 
      categoryId: data.category_id 
    }, 'EditProductDialog');
    
    try {
      const addedUnits = data.has_serial 
        ? Math.max(0, (data.serial_numbers?.length || 0) - initialSerialCount) 
        : 0;
        
      const updatedProduct = {
        brand: data.brand,
        model: data.model,
        year: data.year,
        category_id: data.category_id,
        price: data.price,
        min_price: data.min_price,
        max_price: data.max_price,
        stock: data.stock,
        threshold: data.threshold,
        description: data.description || undefined,
        supplier: data.supplier || undefined,
        barcode: data.barcode || undefined,
        has_serial: data.has_serial,
        serial_numbers: data.has_serial ? data.serial_numbers : undefined,
      };

      // Update the main product first
      await updateProduct.mutateAsync({ 
        id: product.id, 
        data: updatedProduct 
      });
      
      // If product has serial numbers, create/update product units with RAM and storage data
      if (data.has_serial && data.serial_numbers && data.serial_numbers.length > 0) {
        try {
          // Get existing units for this product
          const existingUnits = await ProductUnitsService.getUnitsForProduct(product.id);
          
          // Get current serials - use them directly
          const currentSerials = data.serial_numbers || [];
          const unitsToDelete = existingUnits.filter(unit => 
            !currentSerials.includes(unit.serial_number)
          );
          
          for (const unit of unitsToDelete) {
            await ProductUnitsService.deleteUnit(unit.id);
          }
          
          // Create units for new serial numbers
          const existingSerials = existingUnits.map(unit => unit.serial_number);
          const newSerials = (data.serial_numbers || []).filter(sn => 
            !existingSerials.includes(sn)
          );
          
          if (newSerials.length > 0) {
            // For edit dialog, we need to handle unit entries if they exist
            const correspondingEntries = data.unit_entries?.filter(entry => 
              newSerials.some(serial => serial.split(' ')[0] === entry.serial)
            );
            
            // Get new unit entries that correspond to new serials
            const newUnitEntries = data.unit_entries?.filter(entry => 
              newSerials.includes(entry.serial)
            ) || [];
            
            await ProductUnitsService.createUnitsForProduct(
              product.id, 
              newUnitEntries, // Pass structured unit entries directly
              { // Default pricing fallback
                price: data.price,
                min_price: data.min_price,
                max_price: data.max_price
              }
            );
            console.log(`✅ Created ${newSerials.length} new product units with default pricing`);
            
            // Refresh thermal labels after updating product units
            if (typeof (window as any).__refreshThermalLabels === 'function') {
              console.log('🔄 Refreshing thermal labels after product unit update');
              (window as any).__refreshThermalLabels();
            }
          }
          
        } catch (unitsError) {
          console.error('Error managing product units:', unitsError);
          // Don't fail the whole update if units fail
          toast.error("Product updated but there was an issue with unit data. Please check the inventory.");
        }
      }
      
      // Invalidate thermal labels cache after successful update
      if (typeof (window as any).__refreshThermalLabels === 'function') {
        console.log('🔄 Refreshing thermal labels after product update');
        (window as any).__refreshThermalLabels();
      }
      
      if (addedUnits > 0) {
        toast.success(`Product updated successfully! Added ${addedUnits} new units. Total stock: ${data.stock}`);
      } else {
        toast.success("Product updated successfully!");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      log.error('Product update failed', error, 'EditProductDialog');
    }
  };

  const handleFormDialogSubmit = async () => {
    console.log('🔄 FormDialog submit wrapper called');
    // Call the form's submit function directly through the global handler
    const formSubmitHandler = (window as any).__currentFormSubmit;
    if (formSubmitHandler) {
      await formSubmitHandler();
    }
  };

  // Don't render until initial data is loaded
  if (!initialData) {
    return (
      <FormDialog
        title="Loading..."
        open={open}
        onClose={onClose}
        onSubmit={() => Promise.resolve()}
        isLoading={true}
        submitText="Loading..."
        maxWidth="xl"
      >
        <div className="p-8 text-center">
          <p>Loading product data...</p>
        </div>
      </FormDialog>
    );
  }

  return (
    <FormDialog
      title={`Edit Product: ${product.brand} ${product.model}`}
      open={open}
      onClose={onClose}
      onSubmit={handleFormDialogSubmit}
      isLoading={updateProduct.isPending}
      submitText="Update Product"
      maxWidth="xl"
    >
      <ProductForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
        submitText="Update Product"
      />
    </FormDialog>
  );
}