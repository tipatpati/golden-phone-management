import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductUnit } from "@/services/products/productUnitsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface UnitPricingDialogProps {
  unit: ProductUnit | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UnitPricingDialog({ unit, open, onClose, onSuccess }: UnitPricingDialogProps) {
  const [formData, setFormData] = useState({
    price: unit?.price?.toString() || '',
    min_price: unit?.min_price?.toString() || '',
    max_price: unit?.max_price?.toString() || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when unit changes
  React.useEffect(() => {
    if (unit) {
      setFormData({
        price: unit.price?.toString() || '',
        min_price: unit.min_price?.toString() || '',
        max_price: unit.max_price?.toString() || ''
      });
      setErrors({});
    }
  }, [unit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const price = parseFloat(formData.price) || 0;
    const minPrice = parseFloat(formData.min_price) || 0;
    const maxPrice = parseFloat(formData.max_price) || 0;

    // Validate that selling prices are greater than base price
    if (price > 0) {
      if (minPrice > 0 && minPrice <= price) {
        newErrors.min_price = 'Minimum selling price must be greater than base price';
      }
      if (maxPrice > 0 && maxPrice <= price) {
        newErrors.max_price = 'Maximum selling price must be greater than base price';
      }
    }

    // Validate min < max relationship
    if (minPrice > 0 && maxPrice > 0 && minPrice >= maxPrice) {
      newErrors.min_price = 'Minimum price must be less than maximum price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!unit || !validateForm()) return;

    setIsLoading(true);
    try {
      const updateData: Record<string, any> = {};
      
      if (formData.price) updateData.price = parseFloat(formData.price);
      if (formData.min_price) updateData.min_price = parseFloat(formData.min_price);
      if (formData.max_price) updateData.max_price = parseFloat(formData.max_price);

      const { error } = await supabase
        .from('product_units')
        .update(updateData)
        .eq('id', unit.id);

      if (error) throw error;

      toast.success('Unit pricing updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating unit pricing:', error);
      toast.error('Failed to update unit pricing');
    } finally {
      setIsLoading(false);
    }
  };

  if (!unit) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Unit Pricing - {unit.serial_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Base Purchase Price (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_price">Minimum Selling Price (€)</Label>
            <Input
              id="min_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.min_price}
              onChange={(e) => setFormData(prev => ({ ...prev, min_price: e.target.value }))}
              placeholder="0.00"
            />
            {errors.min_price && (
              <p className="text-xs text-destructive">{errors.min_price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_price">Maximum Selling Price (€)</Label>
            <Input
              id="max_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.max_price}
              onChange={(e) => setFormData(prev => ({ ...prev, max_price: e.target.value }))}
              placeholder="0.00"
            />
            {errors.max_price && (
              <p className="text-xs text-destructive">{errors.max_price}</p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Pricing Rules:</strong><br />
              • Selling prices must be greater than base price<br />
              • Minimum price must be less than maximum price<br />
              • Leave fields empty if not applicable
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Pricing'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}