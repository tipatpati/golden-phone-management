import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Package, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliers } from '@/services/suppliers/SuppliersReactQueryService';
import { useProducts } from '@/hooks/useInventory';
import { AcquisitionProductForm } from './AcquisitionProductForm';
import { supplierAcquisitionService, type AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { ProductFormData, UnitEntryForm } from '@/services/inventory/types';

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

  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const categories = [{ id: 1, name: 'Electronics' }, { id: 2, name: 'Accessories' }];

  const form = useForm<AcquisitionFormData>({
    resolver: zodResolver(acquisitionSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0]
    }
  });

  const addNewProductItem = useCallback(() => {
    const newItem: AcquisitionItem = {
      createsNewProduct: true,
      productData: {
        brand: '',
        model: '',
        price: 0,
        min_price: 0,
        max_price: 0,
        description: '',
        category_id: null,
        year: null,
        supplier: '',
        threshold: 0,
        has_serial: false,
        stock: 0,
        unit_entries: []
      },
      quantity: 1,
      unitCost: 0,
      unitEntries: []
    };
    setItems(prev => [...prev, newItem]);
  }, []);

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

  const updateUnitEntries = useCallback((index: number, unitEntries: UnitEntryForm[]) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, unitEntries, quantity: unitEntries.length } : item
    ));
  }, []);

  const calculateTotal = useCallback(() => {
    return items.reduce((total, item) => total + (item.unitCost * item.quantity), 0);
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
          <CardTitle>Supplier Acquisition</CardTitle>
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
                    {suppliers.map((supplier) => (
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

              {items.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base">
                      {item.createsNewProduct ? 'New Product' : 'Existing Product'} #{index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.createsNewProduct ? (
                      <div className="space-y-4">
                        <ProductFormFields
                          formData={item.productData!}
                          onFieldChange={(field, value) => updateProductData(index, { [field]: value })}
                          getFieldError={() => undefined}
                        />
                        
                        {item.productData?.has_serial && (
                          <SerialNumbersInput
                            entries={item.unitEntries}
                            setEntries={(entries) => updateUnitEntries(index, entries)}
                            setStock={() => {}} // Stock managed automatically
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select 
                            onValueChange={(value) => updateItem(index, { productId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {(products || []).map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.brand} {product.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Cost</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => updateItem(index, { unitCost: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!item.createsNewProduct && (
                      <div className="space-y-2">
                        <Label>Unit Cost</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateItem(index, { unitCost: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    )}

                    <div className="text-right text-sm text-muted-foreground">
                      Total: ${(item.unitCost * item.quantity).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}

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
                Total Amount: ${calculateTotal().toFixed(2)}
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
    </div>
  );
}