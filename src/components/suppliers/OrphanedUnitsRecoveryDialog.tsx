import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { orphanedUnitsRecoveryService, type OrphanedUnit } from '@/services/suppliers/OrphanedUnitsRecoveryService';
import { useSuppliers } from '@/services/suppliers/SuppliersReactQueryService';
import { useSimpleDraft } from '@/hooks/useSimpleDraft';

interface OrphanedUnitsRecoveryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrphanedUnitsRecoveryDialog({
  open,
  onClose,
  onSuccess
}: OrphanedUnitsRecoveryDialogProps) {
  const [orphanedUnits, setOrphanedUnits] = useState<OrphanedUnit[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  const { data: suppliers = [] } = useSuppliers();

  // Simple draft functionality for this dialog
  const draft = useSimpleDraft('orphaned_recovery', {
    supplierId,
    estimatedPrice,
    notes,
    selectedUnitIds
  });

  // Load orphaned units when dialog opens
  useEffect(() => {
    if (open) {
      loadOrphanedUnits();
      // Check for draft data and try to restore from acquisition draft
      loadDraftData();
    }
  }, [open]);

  const loadOrphanedUnits = async () => {
    setIsLoadingUnits(true);
    try {
      const units = await orphanedUnitsRecoveryService.findOrphanedUnits();
      setOrphanedUnits(units);
      
      if (units.length === 0) {
        toast.info('No orphaned units found');
      } else {
        toast.success(`Found ${units.length} orphaned units`);
        // Auto-select all units
        setSelectedUnitIds(units.map(u => u.id));
      }
    } catch (error) {
      console.error('Failed to load orphaned units:', error);
      toast.error('Failed to load orphaned units');
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const loadDraftData = async () => {
    try {
      // Try to get acquisition draft data
      const acquisitionDraft = localStorage.getItem('simple_draft_acquisition');
      if (acquisitionDraft) {
        const draftData = JSON.parse(acquisitionDraft);
        const suggestedRecovery = await orphanedUnitsRecoveryService.getSuggestedRecovery(draftData.formData);
        
        if (suggestedRecovery.supplier_id) {
          setSupplierId(suggestedRecovery.supplier_id);
          toast.info('Found draft acquisition data - pre-filled supplier information');
        }
        
        if (suggestedRecovery.estimated_purchase_price) {
          setEstimatedPrice(suggestedRecovery.estimated_purchase_price);
        }
        
        if (suggestedRecovery.notes) {
          setNotes(suggestedRecovery.notes);
        }
      }
    } catch (error) {
      console.error('Failed to load draft data:', error);
    }
  };

  const handleUnitToggle = (unitId: string, checked: boolean) => {
    if (checked) {
      setSelectedUnitIds(prev => [...prev, unitId]);
    } else {
      setSelectedUnitIds(prev => prev.filter(id => id !== unitId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUnitIds(orphanedUnits.map(u => u.id));
    } else {
      setSelectedUnitIds([]);
    }
  };

  const calculateTotalValue = () => {
    return selectedUnitIds.length * estimatedPrice;
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    if (selectedUnitIds.length === 0) {
      toast.error('Please select at least one unit to recover');
      return;
    }

    setIsLoading(true);
    try {
      const result = await orphanedUnitsRecoveryService.createRecoveryTransaction({
        supplier_id: supplierId,
        unit_ids: selectedUnitIds,
        estimated_purchase_price: estimatedPrice,
        notes: notes || undefined
      });

      if (result.success) {
        toast.success(`Successfully recovered ${selectedUnitIds.length} orphaned units`);
        
        // Clear the acquisition draft since we've recovered the units
        localStorage.removeItem('simple_draft_acquisition');
        draft.clearDraft();
        
        onSuccess();
        onClose();
      } else {
        toast.error(`Recovery failed: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      toast.error('Recovery failed');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUnits = orphanedUnits.filter(unit => selectedUnitIds.includes(unit.id));
  const groupedByProduct = selectedUnits.reduce((acc, unit) => {
    const key = `${unit.product_brand} ${unit.product_model}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(unit);
    return acc;
  }, {} as Record<string, OrphanedUnit[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Recover Orphaned Units
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recovery Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recovery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(suppliers) && suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Estimated Purchase Price (per unit)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Recovery Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes about this recovery transaction..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Orphaned Units */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Orphaned Units ({orphanedUnits.length})
                </span>
                {orphanedUnits.length > 0 && (
                  <Checkbox
                    checked={selectedUnitIds.length === orphanedUnits.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all units"
                  />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUnits ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Loading orphaned units...</p>
                </div>
              ) : orphanedUnits.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No orphaned units found</p>
                  <p className="text-sm text-muted-foreground">All units are properly linked to suppliers</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {orphanedUnits.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedUnitIds.includes(unit.id)}
                          onCheckedChange={(checked) => handleUnitToggle(unit.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {unit.product_brand} {unit.product_model}
                            </p>
                            <Badge 
                              variant={unit.orphan_type === 'no_supplier' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {unit.orphan_type === 'no_supplier' ? 'No Supplier' : 'No Transaction'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Serial: {unit.serial_number}
                          </p>
                          {unit.supplier_name && (
                            <p className="text-xs text-muted-foreground">
                              Supplier: {unit.supplier_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(unit.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">€{unit.price}</p>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recovery Summary */}
          {selectedUnitIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recovery Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Selected Units:</span>
                    <span className="font-medium">{selectedUnitIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Price per Unit:</span>
                    <span className="font-medium">€{estimatedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Estimated Value:</span>
                    <span className="font-bold">€{calculateTotalValue().toFixed(2)}</span>
                  </div>
                </div>
                
                {Object.keys(groupedByProduct).length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-medium">Products:</p>
                    {Object.entries(groupedByProduct).map(([product, units]) => (
                      <p key={product} className="text-xs text-muted-foreground">
                        • {product} ({units.length} unit{units.length > 1 ? 's' : ''})
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || selectedUnitIds.length === 0 || !supplierId}
          >
            {isLoading ? 'Processing...' : `Recover ${selectedUnitIds.length} Units`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}