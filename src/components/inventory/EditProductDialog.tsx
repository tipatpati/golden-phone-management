import React, { useState, useEffect } from "react";
import { FormDialog } from "@/components/common/FormDialog";
import { ProductForm } from "./forms/ProductForm";
import { useUpdateProduct } from "@/hooks/useInventory";
import type { Product, ProductFormData, UnitEntryForm } from "@/services/inventory/types";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";
import { useQueryClient } from "@tanstack/react-query";

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
  logger.debug('EditProductDialog rendering', { productId: product.id }, 'EditProductDialog');
  
  const [initialData, setInitialData] = useState<Partial<ProductFormData> | null>(null);
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const initialSerialCount = product.serial_numbers?.length || 0;

  // Load existing product units and prepare initial data
  useEffect(() => {
    const loadProductData = async () => {
      try {
        // Use ProductUnitCoordinator for unified data loading
        const { productUnitCoordinator } = await import('@/services/shared/ProductUnitCoordinator');
        const result = await productUnitCoordinator.getProductWithUnits(product.id);
        
        if (!result.product) {
          throw new Error('Product not found');
        }
        
        logger.debug('Loaded product data via coordinator for edit', {
          productId: product.id,
          unitCount: result.units.length,
          unitEntriesCount: result.unitEntries.length,
          hasSerial: result.product.has_serial
        });
        
        const preparedData: Partial<ProductFormData> = {
          brand: result.product.brand || "",
          model: result.product.model || "",
          year: result.product.year,
          category_id: result.product.category_id,
          price: result.product.price,
          min_price: result.product.min_price,
          max_price: result.product.max_price,
          stock: result.product.stock,
          threshold: result.product.threshold,
          description: result.product.description || "",
          supplier: result.product.supplier || "",
          barcode: result.product.barcode || "",
          has_serial: result.product.has_serial || false,
          serial_numbers: result.product.serial_numbers || [],
          unit_entries: result.unitEntries,
        };
        
        logger.debug('Prepared initial data for edit via coordinator', {
          productId: product.id,
          unitEntriesCount: result.unitEntries.length,
          hasSerial: result.product.has_serial,
          unitEntries: result.unitEntries
        });
        
        setInitialData(preparedData);
      } catch (error) {
        logger.error('Failed to load product units for edit via coordinator', error, 'EditProductDialog');
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
    logger.debug('EditProductDialog handleSubmit called', { data }, 'EditProductDialog');
    logger.debug('Submitting product update', { 
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
        // Get existing units for this product - EXCLUDE sold units from editing
        const existingUnits = await ProductUnitManagementService.getUnitsForProduct(product.id, undefined, true);
        const availableUnits = existingUnits.filter(unit => unit.status === 'available');
        
        // Get current serials - use them directly
        const currentSerials = data.serial_numbers || [];
        const unitsToDelete = availableUnits.filter(unit => 
          !currentSerials.includes(unit.serial_number)
        );
        
        // Mark removed units as damaged (delete capability will be added later)
        for (const unit of unitsToDelete) {
          await ProductUnitManagementService.updateUnitStatus(unit.id, 'damaged');
        }
        
        // Create units for new serial numbers using unified service - only consider available units
        const existingSerials = availableUnits.map(unit => unit.serial_number);
        const newUnitEntries = data.unit_entries?.filter(entry => 
          !existingSerials.includes(entry.serial)
        ) || [];
        
        if (newUnitEntries.length > 0) {
          await ProductUnitManagementService.createUnitsForProduct({
            productId: product.id, 
            unitEntries: newUnitEntries,
            defaultPricing: {
              price: data.price,
              min_price: data.min_price,
              max_price: data.max_price
            }
          });
          logger.info(`Created ${newUnitEntries.length} new product units with default pricing`, {}, 'EditProductDialog');
        }
        
        // Update pricing for existing units if unit_entries have pricing changes - only available units
        const existingUnitEntries = data.unit_entries?.filter(entry => 
          existingSerials.includes(entry.serial)
        ) || [];
        
        if (existingUnitEntries.length > 0) {
          const { updated, errors } = await ProductUnitManagementService.updateUnitsWithPricing(
            product.id, 
            existingUnitEntries
          );
          
          if (updated > 0) {
            logger.info(`Updated pricing for ${updated} existing units`, {}, 'EditProductDialog');
          }
          
          if (errors.length > 0) {
            logger.warn('Some unit pricing updates failed', { errors }, 'EditProductDialog');
          }
        }
        
        // Sync product-level min/max prices from actual unit prices
        await ProductUnitManagementService.syncProductPricing(product.id);
        
        // Refresh thermal labels after updating product units
        if (typeof (window as any).__refreshThermalLabels === 'function') {
          logger.info('Refreshing thermal labels after product unit update', {}, 'EditProductDialog');
          (window as any).__refreshThermalLabels();
        }
      }

      // Force cache invalidation for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', product.id] });
      
      // Refresh thermal labels after product update
      if (typeof (window as any).__refreshThermalLabels === 'function') {
        logger.info('Refreshing thermal labels after product update', {}, 'EditProductDialog');
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
      logger.error('Product update failed', error, 'EditProductDialog');
    }
  };

  const handleFormDialogSubmit = async () => {
    logger.debug('FormDialog submit wrapper called', {}, 'EditProductDialog');
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
        size="lg"
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
      size="lg"
    >
      <ProductForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
        submitText="Update Product"
        productId={product.id}
      />
    </FormDialog>
  );
}