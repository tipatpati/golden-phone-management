import React, { useState, useEffect } from "react";
import {
  Dialog,
  EnhancedDialogContent as DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/enhanced-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Hash, 
  Barcode as BarcodeIcon, 
  Palette, 
  HardDrive, 
  Cpu, 
  Battery, 
  Euro,
  Package,
  Calendar,
  Truck,
  Save,
  Printer,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { formatProductName } from "@/utils/productNaming";
import { ProductSearchSelector } from "@/components/suppliers/forms/ProductSearchSelector";
import { ProductReassignmentService } from "@/services/inventory/ProductReassignmentService";
import { ProductUnitsService } from "@/services/inventory/ProductUnitsService";

interface UnitDetailsDialogProps {
  unit: any | null;
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint?: (unitId: string) => void;
}

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "defective", label: "Defective" },
];

export function UnitDetailsDialog({
  unit: initialUnit,
  product,
  open,
  onOpenChange,
  onPrint,
}: UnitDetailsDialogProps) {
  const [unit, setUnit] = useState(initialUnit);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingProduct, setIsChangingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showReassignConfirm, setShowReassignConfirm] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all serialized products for the selector
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-reassignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, brand, model, has_serial')
        .eq('has_serial', true)
        .order('brand', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open && isEditing
  });

  useEffect(() => {
    if (initialUnit) {
      setUnit(initialUnit);
    }
  }, [initialUnit]);

  const handleProductChange = async () => {
    if (!selectedProductId || selectedProductId === product.id) {
      setIsChangingProduct(false);
      setSelectedProductId(null);
      return;
    }

    // Validate reassignment
    const validation = await ProductReassignmentService.validateReassignment(
      unit.id!,
      product.id,
      selectedProductId,
      unit.serial_number
    );

    if (!validation.isValid) {
      toast({
        title: "Cannot reassign unit",
        description: validation.errors.join('. '),
        variant: "destructive",
      });
      setIsChangingProduct(false);
      setSelectedProductId(null);
      return;
    }

    // Store warnings and show confirmation
    setValidationWarnings(validation.warnings);
    setShowReassignConfirm(true);
  };

  const confirmReassignment = async () => {
    if (!selectedProductId || !unit.id) return;

    const oldProductId = unit.product_id;
    setIsSaving(true);
    
    try {
      await ProductUnitsService.reassignUnitToProduct(unit.id, selectedProductId);

      // Invalidate both old and new product queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['product', oldProductId] }),
        queryClient.invalidateQueries({ queryKey: ['product', selectedProductId] }),
        queryClient.invalidateQueries({ queryKey: ['product-units', oldProductId] }),
        queryClient.invalidateQueries({ queryKey: ['product-units', selectedProductId] })
      ]);

      toast({
        title: "Success",
        description: "Unit reassigned to new product successfully",
      });

      setIsChangingProduct(false);
      setSelectedProductId(null);
      setShowReassignConfirm(false);
      setValidationWarnings([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reassign unit",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!unit) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('product_units')
        .update({
          color: unit.color,
          storage: unit.storage,
          ram: unit.ram,
          battery_level: unit.battery_level,
          price: unit.price,
          min_price: unit.min_price,
          max_price: unit.max_price,
          condition: unit.condition,
          status: unit.status,
        })
        .eq('id', unit.id);

      if (error) throw error;

      toast({
        title: "Unit updated",
        description: "Product unit has been successfully updated.",
      });

      // Refresh product list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating unit:', error);
      toast({
        title: "Error",
        description: "Failed to update unit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!unit || !product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Unit Details</span>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => onPrint?.(unit.id)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Barcode
                  </Button>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {formatProductName({ brand: product.brand, model: product.model })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Assignment Section - Only in edit mode */}
          {isEditing && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">PRODUCT ASSIGNMENT</h3>
                {!isChangingProduct ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div>
                      <div className="font-medium">{product.brand} {product.model}</div>
                      <div className="text-xs text-muted-foreground">Current product</div>
                    </div>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => setIsChangingProduct(true)}
                      disabled={unit.status === 'sold'}
                    >
                      Change Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Changing the product will reassign this unit. This action will be logged for audit purposes.
                      </AlertDescription>
                    </Alert>
                    <ProductSearchSelector
                      products={products}
                      value={selectedProductId || ''}
                      onChange={setSelectedProductId}
                      placeholder="Search for new product..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleProductChange}
                        disabled={!selectedProductId || selectedProductId === product.id}
                      >
                        Confirm Change
                      </Button>
                      <Button
                        size="sm"
                        variant="outlined"
                        onClick={() => {
                          setIsChangingProduct(false);
                          setSelectedProductId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Identifiers Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">IDENTIFIERS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  Serial Number
                </Label>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  {unit.serial_number}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BarcodeIcon className="h-3 w-3" />
                  Barcode
                </Label>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  {unit.barcode || "Not generated"}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Specifications Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">SPECIFICATIONS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color" className="flex items-center gap-2 text-xs">
                  <Palette className="h-3 w-3" />
                  Color
                </Label>
                {isEditing ? (
                  <Input
                    id="color"
                    value={unit.color || ""}
                    onChange={(e) => setUnit({ ...unit, color: e.target.value })}
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {unit.color || "-"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage" className="flex items-center gap-2 text-xs">
                  <HardDrive className="h-3 w-3" />
                  Storage (GB)
                </Label>
                {isEditing ? (
                  <Input
                    id="storage"
                    type="number"
                    value={unit.storage || ""}
                    onChange={(e) => setUnit({ ...unit, storage: parseInt(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {unit.storage ? `${unit.storage} GB` : "-"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ram" className="flex items-center gap-2 text-xs">
                  <Cpu className="h-3 w-3" />
                  RAM (GB)
                </Label>
                {isEditing ? (
                  <Input
                    id="ram"
                    type="number"
                    value={unit.ram || ""}
                    onChange={(e) => setUnit({ ...unit, ram: parseInt(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {unit.ram ? `${unit.ram} GB` : "-"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="battery" className="flex items-center gap-2 text-xs">
                  <Battery className="h-3 w-3" />
                  Battery Level (%)
                </Label>
                {isEditing ? (
                  <Input
                    id="battery"
                    type="number"
                    min="0"
                    max="100"
                    value={unit.battery_level || ""}
                    onChange={(e) => setUnit({ ...unit, battery_level: parseInt(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {unit.battery_level ? `${unit.battery_level}%` : "-"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">PRICING</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2 text-xs">
                  <Euro className="h-3 w-3" />
                  Base Price
                </Label>
                {isEditing ? (
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={unit.price || ""}
                    onChange={(e) => setUnit({ ...unit, price: parseFloat(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {unit.price ? `€${unit.price.toFixed(2)}` : "-"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_price" className="flex items-center gap-2 text-xs">
                  Min Price
                </Label>
                {isEditing ? (
                  <Input
                    id="min_price"
                    type="number"
                    step="0.01"
                    value={unit.min_price || ""}
                    onChange={(e) => setUnit({ ...unit, min_price: parseFloat(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {unit.min_price ? `€${unit.min_price.toFixed(2)}` : "-"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_price" className="flex items-center gap-2 text-xs">
                  Max Price
                </Label>
                {isEditing ? (
                  <Input
                    id="max_price"
                    type="number"
                    step="0.01"
                    value={unit.max_price || ""}
                    onChange={(e) => setUnit({ ...unit, max_price: parseFloat(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {unit.max_price ? `€${unit.max_price.toFixed(2)}` : "-"}
                  </div>
                )}
              </div>
            </div>
            {unit.purchase_price && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                Purchase Price: €{unit.purchase_price.toFixed(2)}
              </div>
            )}
          </div>

          <Separator />

          {/* Status Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">STATUS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition" className="flex items-center gap-2 text-xs">
                  <Package className="h-3 w-3" />
                  Condition
                </Label>
                {isEditing ? (
                  <Select
                    value={unit.condition}
                    onValueChange={(value) => setUnit({ ...unit, condition: value })}
                  >
                    <SelectTrigger id="condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="justify-start">
                    {CONDITIONS.find(c => c.value === unit.condition)?.label || unit.condition}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2 text-xs">
                  Status
                </Label>
                {isEditing ? (
                  <Select
                    value={unit.status}
                    onValueChange={(value) => setUnit({ ...unit, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn(
                      "justify-start",
                      unit.status === 'available' && 'bg-green-100 text-green-800',
                      unit.status === 'sold' && 'bg-gray-100 text-gray-800',
                      unit.status === 'reserved' && 'bg-yellow-100 text-yellow-800',
                      unit.status === 'defective' && 'bg-red-100 text-red-800'
                    )}
                  >
                    {STATUSES.find(s => s.value === unit.status)?.label || unit.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          {(unit.created_at || unit.supplier_id) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">METADATA</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  {unit.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Added: {new Date(unit.created_at).toLocaleDateString()}
                    </div>
                  )}
                  {unit.supplier_id && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3" />
                      Supplier ID: {unit.supplier_id}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outlined"
              onClick={() => {
                setUnit(initialUnit);
                setIsEditing(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Reassignment Confirmation Dialog */}
      <AlertDialog open={showReassignConfirm} onOpenChange={setShowReassignConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Product Reassignment</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to reassign this unit from <strong>{product.brand} {product.model}</strong> to the selected product?
              </p>
              {validationWarnings.length > 0 && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {validationWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-xs mt-2 text-muted-foreground">
                This action will be logged in the product unit history for audit purposes.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowReassignConfirm(false);
              setIsChangingProduct(false);
              setSelectedProductId(null);
              setValidationWarnings([]);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReassignment} disabled={isSaving}>
              {isSaving ? "Reassigning..." : "Confirm Reassignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
