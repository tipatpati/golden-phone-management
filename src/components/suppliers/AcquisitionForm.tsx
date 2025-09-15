import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { DraftIndicator } from '@/components/ui/draft-indicator';
import { DraftRestoreDialog } from '@/components/ui/draft-restore-dialog';
import { useSuppliers } from '@/services/suppliers/SuppliersReactQueryService';
import { useProducts } from '@/hooks/useInventory';
import { NewProductItem } from './forms/NewProductItem';
import { ExistingProductItem } from './forms/ExistingProductItem';
import { supplierAcquisitionService, type AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { ProductFormData, UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';

const acquisitionSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  transactionDate: z.string().min(1, 'Transaction date is required'),
  notes: z.string().optional()
});

type AcquisitionFormData = z.infer<typeof acquisitionSchema>;

interface AcquisitionFormProps {
  onSuccess: () => void;
}

export function AcquisitionForm({ onSuccess }: AcquisitionFormProps) {
  const [items, setItems] = useState<AcquisitionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  const { data: suppliers } = useSuppliers();
  const { data: products = [] } = useProducts();

  // Extract unique brands and models for autocomplete
  const { uniqueBrands, uniqueModels } = useMemo(() => {
    const brands = new Set<string>();
    const models = new Set<string>();
    
    products.forEach(product => {
      if (product.brand) brands.add(product.brand);
      if (product.model) models.add(product.model);
    });
    
    return {
      uniqueBrands: Array.from(brands),
      uniqueModels: Array.from(models)
    };
  }, [products]);

  const form = useForm<AcquisitionFormData>({
    resolver: zodResolver(acquisitionSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0]
    }
  });

  // Prepare form data for auto-save
  const formDataForSave = useMemo(() => ({
    ...form.getValues(),
    items
  }), [form.watch(), items]);

  // Auto-save draft functionality
  const autoSave = useAutoSaveDraft('acquisition', formDataForSave, {
    enabled: true,
    debounceMs: 3000,
    onDraftSaved: (draftId) => {
      console.log('Draft saved:', draftId);
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
    }
  });

  // Check for existing draft on mount
  useEffect(() => {
    if (autoSave.isDraftAvailable) {
      setShowDraftDialog(true);
    }
  }, [autoSave.isDraftAvailable]);

  const handleRestoreDraft = () => {
    const draft = autoSave.restoreDraft();
    if (draft && draft.formData) {
      // Restore form values
      if (draft.formData.supplierId) form.setValue('supplierId', draft.formData.supplierId);
      if (draft.formData.transactionDate) form.setValue('transactionDate', draft.formData.transactionDate);
      if (draft.formData.notes) form.setValue('notes', draft.formData.notes);
      
      // Restore items
      if (draft.formData.items && Array.isArray(draft.formData.items)) {
        setItems(draft.formData.items);
      }
    }
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    autoSave.deleteAllDrafts();
    setShowDraftDialog(false);
  };

  const addNewProductItem = useCallback(async () => {
    const newItem: AcquisitionItem = {
      createsNewProduct: true,
      productData: {
        brand: '',
        model: '',
        price: 1, // Set default price > 0 to pass validation
        min_price: 0,
        max_price: 0,
        description: '',
        category_id: 1,
        year: null,
        supplier: '',
        threshold: 0,
        has_serial: false,
        stock: 0,
        unit_entries: []
      },
      quantity: 1,
      unitCost: 1, // Set default unit cost > 0
      unitEntries: []
    };
    
    const newIndex = items.length;
    setItems(prev => [...prev, newItem]);
    
    // Removed immediate product barcode generation to avoid invalid UUID in registry

  }, [items.length]);

  const addExistingProductItem = useCallback(() => {
    const newItem: AcquisitionItem = {
      createsNewProduct: false,
      productId: '',
      quantity: 1,
      unitCost: 0,
      unitEntries: []
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, updates: Partial<AcquisitionItem>) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  }, []);

  const updateProductData = useCallback((index: number, productData: Partial<ProductFormData>) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { 
        ...item, 
        productData: { ...item.productData!, ...productData }
      } : item
    ));
  }, []);

  const updateUnitEntries = useCallback((index: number, unitEntries: UnitEntryFormType[]) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        // Calculate average unit cost from individual unit entries
        const validUnits = unitEntries.filter(unit => unit.price && unit.price > 0);
        const calculatedUnitCost = validUnits.length > 0 
          ? validUnits.reduce((sum, unit) => sum + (unit.price || 0), 0) / validUnits.length
          : item.unitCost;
        
        return { 
          ...item, 
          unitEntries, 
          quantity: unitEntries.length,
          unitCost: calculatedUnitCost
        };
      }
      return item;
    }));
  }, []);

  const calculateTotal = useCallback(() => {
    return items.reduce((total, item) => {
      // Check if item has individual unit pricing
      const hasIndividualPricing = item.unitEntries.some(entry => entry.price && entry.price > 0);
      
      if (hasIndividualPricing) {
        // Sum individual unit prices
        return total + item.unitEntries.reduce((sum, entry) => sum + (entry.price || 0), 0);
      } else {
        // Use bulk pricing
        return total + (item.unitCost * item.quantity);
      }
    }, 0);
  }, [items]);

  const onSubmit = async (data: AcquisitionFormData) => {
    if (items.length === 0) {
      toast.error('Please add at least one item to the acquisition');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await supplierAcquisitionService.createAcquisition({
        supplierId: data.supplierId,
        transactionDate: new Date(data.transactionDate),
        items,
        notes: data.notes
      });

      if (result.success) {
        toast.success('Supplier acquisition completed successfully');
        // Clear the draft after successful submission
        autoSave.deleteAllDrafts();
        onSuccess();
      } else {
        toast.error(result.errors?.join(', ') || 'Failed to complete acquisition');
      }
    } catch (error) {
      console.error('Acquisition failed:', error);
      toast.error('Failed to complete acquisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Supplier Acquisition</CardTitle>
            <DraftIndicator
              isAutoSaving={autoSave.isAutoSaving}
              lastSavedAt={autoSave.lastSavedAt}
              isDraftAvailable={autoSave.isDraftAvailable}
              onRestoreDraft={() => setShowDraftDialog(true)}
              onClearDraft={autoSave.deleteAllDrafts}
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <Select onValueChange={(value) => form.setValue('supplierId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers && Array.isArray(suppliers) && suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.supplierId && (
                  <p className="text-sm text-red-500">{form.formState.errors.supplierId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionDate">Transaction Date</Label>
                <Input
                  id="transactionDate"
                  type="date"
                  {...form.register('transactionDate')}
                />
                {form.formState.errors.transactionDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.transactionDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this acquisition..."
                {...form.register('notes')}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Acquisition Items</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addExistingProductItem}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Add Existing Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNewProductItem}
                  >
                    <PackagePlus className="w-4 h-4 mr-2" />
                    Add New Product
                  </Button>
                </div>
              </div>

              {items.map((item, index) => 
                item.createsNewProduct ? (
                  <NewProductItem
                    key={index}
                    item={item}
                    index={index}
                    uniqueBrands={uniqueBrands}
                    uniqueModels={uniqueModels}
                    onRemove={() => removeItem(index)}
                    onUpdateProductData={(productData) => updateProductData(index, productData)}
                    onUpdateUnitEntries={(unitEntries) => updateUnitEntries(index, unitEntries)}
                  />
                ) : (
                  <ExistingProductItem
                    key={index}
                    item={item}
                    index={index}
                    products={products}
                    onRemove={() => removeItem(index)}
                    onUpdateItem={(updates) => updateItem(index, updates)}
                    onUpdateUnitEntries={(unitEntries) => updateUnitEntries(index, unitEntries)}
                  />
                )
              )}

              {items.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items added yet</p>
                    <p className="text-sm text-muted-foreground">Add products to start your acquisition</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-lg font-semibold">
                Total Amount: €{calculateTotal().toFixed(2)}
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? 'Processing...' : 'Complete Acquisition'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <DraftRestoreDialog
        isOpen={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        draft={autoSave.loadDraft()}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
    </div>
  );
}