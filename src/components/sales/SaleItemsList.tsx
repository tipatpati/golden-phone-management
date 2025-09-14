
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { formatProductName } from "@/utils/productNaming";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { StockCalculationService } from '@/services/inventory/StockCalculationService';
import { useToast } from "@/hooks/use-toast";
import { getSaleItemControlsState, isQuantityChangeValid } from '@/utils/saleItemsUtils';

type SaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  min_price?: number;
  max_price?: number;
  serial_number?: string;
  has_serial?: boolean;
};

type SaleItemsListProps = {
  saleItems: SaleItem[];
  onQuantityUpdate: (productId: string, quantity: number) => void;
  onPriceUpdate: (productId: string, price: number) => void;
  onSerialNumberUpdate: (productId: string, serialNumber: string) => void;
  onRemoveItem: (productId: string) => void;
};

// Serial Search Component
function SerialNumberInput({ 
  productId, 
  value, 
  onSerialNumberUpdate, 
  allProducts,
  disabled = false
}: { 
  productId: string; 
  value: string; 
  onSerialNumberUpdate: (productId: string, serialNumber: string) => void;
  allProducts: any[];
  disabled?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get the current product details
  const currentProduct = useMemo(() => 
    allProducts.find(p => p.id === productId), 
    [allProducts, productId]
  );

  // Find matching serials only from the current product
  const matchingSerials = useMemo(() => {
    if (searchTerm.length < 2 || !currentProduct?.serial_numbers) return [];
    
    const results: Array<{ productId: string; productName: string; serial: string }> = [];
    
    if (Array.isArray(currentProduct.serial_numbers)) {
      currentProduct.serial_numbers.forEach((serial: string) => {
        // Match by last 4 digits or full serial
        const last4 = serial.slice(-4);
        if (serial.toLowerCase().includes(searchTerm.toLowerCase()) || 
            last4.includes(searchTerm)) {
          results.push({
            productId: currentProduct.id,
            productName: formatProductName({ brand: currentProduct.brand, model: currentProduct.model }),
            serial: serial
          });
        }
      });
    }
    
    return results.slice(0, 10); // Limit to 10 results
  }, [searchTerm, currentProduct]);

  // Validate that the entered serial belongs to the current product
  const validateSerial = (serial: string): boolean => {
    if (!serial || !currentProduct?.serial_numbers) return true; // Empty is valid
    
    const serialNumbers = Array.isArray(currentProduct.serial_numbers) 
      ? currentProduct.serial_numbers 
      : [];
    
    return serialNumbers.includes(serial);
  };

  const handleSelect = (serial: string) => {
    if (validateSerial(serial)) {
      onSerialNumberUpdate(productId, serial);
      setValidationError(null);
    } else {
      setValidationError("Questo numero seriale non appartiene al prodotto selezionato");
    }
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleManualInput = (serial: string) => {
    if (validateSerial(serial)) {
      onSerialNumberUpdate(productId, serial);
      setValidationError(null);
    } else if (serial) {
      setValidationError("Questo numero seriale non appartiene al prodotto selezionato");
    } else {
      setValidationError(null);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative">
          <Input
            placeholder="Cerca IMEI/Serial del prodotto..."
            value={value || searchTerm}
            onChange={(e) => {
              const newValue = e.target.value;
              if (!value) {
                setSearchTerm(newValue);
                setIsOpen(newValue.length >= 2);
              } else {
                handleManualInput(newValue);
              }
            }}
            onFocus={() => {
              if (!value && searchTerm.length >= 2) {
                setIsOpen(true);
              }
            }}
            className={`h-10 md:h-12 font-mono text-sm md:text-base bg-background pr-10 ${
              validationError ? 'border-destructive focus:border-destructive' : ''
            }`}
            disabled={disabled}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          {isOpen && matchingSerials.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg">
              <div className="p-2 max-h-48 overflow-y-auto">
                {matchingSerials.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.serial}-${index}`}
                    className="flex flex-col p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => handleSelect(item.serial)}
                  >
                    <div className="font-mono text-sm font-medium">{item.serial}</div>
                    <div className="text-xs text-muted-foreground">{item.productName}</div>
                    <div className="text-xs text-blue-600">Ultime 4: {item.serial.slice(-4)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isOpen && searchTerm.length >= 2 && matchingSerials.length === 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg p-3">
              <div className="text-sm text-muted-foreground text-center">
                Nessun numero seriale trovato per questo prodotto
              </div>
            </div>
          )}
        </div>
      </Popover>
      
      {validationError && (
        <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <span className="text-sm text-destructive">{validationError}</span>
        </div>
      )}
    </div>
  );
}

export function SaleItemsList({ 
  saleItems, 
  onQuantityUpdate, 
  onPriceUpdate, 
  onSerialNumberUpdate, 
  onRemoveItem 
}: SaleItemsListProps) {
  const { toast } = useToast();
  const [realTimeStock, setRealTimeStock] = useState<Map<string, number>>(new Map());
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  
  // Fetch all products to get current stock information
  const { data: allProducts = [] } = useProducts();

  // Refresh real-time stock for all sale items
  const refreshStock = useCallback(async () => {
    if (saleItems.length === 0) return;
    
    setIsRefreshingStock(true);
    try {
      const productIds = saleItems.map(item => item.product_id);
      const stockMap = await StockCalculationService.fetchEffectiveStockBatch(productIds);
      setRealTimeStock(stockMap);
    } catch (error) {
      console.error('Error refreshing stock:', error);
      toast({
        title: "Errore aggiornamento stock",
        description: "Impossibile aggiornare le informazioni di stock",
        variant: "destructive"
      });
    } finally {
      setIsRefreshingStock(false);
    }
  }, [saleItems, toast]);

  // Auto-refresh stock when sale items change
  useEffect(() => {
    refreshStock();
  }, [refreshStock]);
  
  // Helper function to get product stock - now uses real-time data when available
  const getProductStock = useCallback((productId: string) => {
    const realTimeValue = realTimeStock.get(productId);
    if (realTimeValue !== undefined) {
      return realTimeValue;
    }
    return StockCalculationService.effectiveFromList(allProducts as any[], productId);
  }, [realTimeStock, allProducts]);

  // Enhanced quantity update with real-time validation
  const handleQuantityUpdate = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) return;

    // Find the item to check if it's serialized
    const item = saleItems.find(i => i.product_id === productId);
    if (!item) return;
    
    // Check if quantity change is valid for serialized products
    if (!isQuantityChangeValid(item.has_serial || false, quantity)) {
      return;
    }

    // Get real-time stock for validation
    const currentStock = await StockCalculationService.fetchEffectiveStock(productId);
    
    if (quantity > currentStock) {
      toast({
        title: "Stock insufficiente",
        description: `Disponibile: ${currentStock}, Richiesto: ${quantity}`,
        variant: "destructive"
      });
      return;
    }

    onQuantityUpdate(productId, quantity);
    
    // Update local stock cache
    setRealTimeStock(prev => new Map(prev.set(productId, currentStock)));
  }, [onQuantityUpdate, toast, saleItems]);

  if (saleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium text-foreground">Articoli Vendita</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStock}
          disabled={isRefreshingStock}
          className="h-8 px-3 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshingStock ? 'animate-spin' : ''}`} />
          Aggiorna Stock
        </Button>
      </div>
      <div className="space-y-3">
        {saleItems.map((item) => {
          const controlsState = getSaleItemControlsState(item.has_serial || false, item.serial_number);
          
          return (
            <div 
              key={item.product_id} 
              className="border border-border rounded-lg p-4 md:p-6 lg:p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
            {/* Header with product name and remove button */}
            <div className="flex items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm md:text-base lg:text-base leading-tight truncate">
                  {item.product_name}
                </h4>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.product_id)}
                className="h-8 w-8 md:h-9 md:w-9 p-0 shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                aria-label="Rimuovi articolo"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Main content grid - responsive layout optimized for tablet */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-6">
              {/* Quantity Section */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Quantità
                  </Label>
                  {(() => {
                    const availableStock = getProductStock(item.product_id);
                    return (
                      <span className={`text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 rounded-full ${
                        availableStock > 10 ? 'bg-green-100 text-green-700' : 
                        availableStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {availableStock} disponibili
                      </span>
                    );
                  })()}
                </div>
                {(() => {
                  const availableStock = getProductStock(item.product_id);
                  const hasStockWarning = item.quantity > availableStock;
                  
                  return (
                    <div className="space-y-2 md:space-y-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                max={availableStock}
                                value={item.quantity}
                                onChange={(e) => handleQuantityUpdate(item.product_id, parseInt(e.target.value) || 0)}
                                className={`h-10 md:h-12 text-center font-medium text-sm md:text-base ${
                                  hasStockWarning ? "border-destructive focus:border-destructive bg-destructive/5" : "bg-background"
                                }`}
                                disabled={controlsState.isQuantityDisabled}
                              />
                            </div>
                          </TooltipTrigger>
                          {controlsState.quantityTooltip && (
                            <TooltipContent>
                              <p>{controlsState.quantityTooltip}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {hasStockWarning && (
                        <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                          <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-destructive mt-0.5 shrink-0" />
                          <span className="text-xs md:text-sm text-destructive leading-tight">
                            Eccedenza di {item.quantity - availableStock} unità
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Price Section */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Prezzo Unitario
                  </Label>
                  {item.min_price && item.max_price && (
                    <span className="text-xs md:text-sm text-muted-foreground bg-muted px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                      €{item.min_price} - €{item.max_price}
                    </span>
                  )}
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm md:text-base">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      min={item.min_price || 0}
                      max={item.max_price || undefined}
                      value={item.unit_price}
                      onChange={(e) => onPriceUpdate(item.product_id, parseFloat(e.target.value) || 0)}
                      className={`h-10 md:h-12 pl-7 md:pl-8 font-medium text-sm md:text-base ${
                        item.min_price && item.max_price && 
                        (item.unit_price < item.min_price || item.unit_price > (item.max_price * 1.2))
                          ? "border-amber-400 focus:border-amber-500 bg-amber-50" 
                          : "bg-background"
                      }`}
                    />
                  </div>
                  {item.min_price && item.max_price && 
                   (item.unit_price < item.min_price || item.unit_price > (item.max_price * 1.2)) && (
                     <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-amber-100 border border-amber-200 rounded-md">
                       <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-amber-600 mt-0.5 shrink-0" />
                       <span className="text-xs md:text-sm text-amber-800 leading-tight">
                         Prezzo consigliato: €{item.min_price} - €{item.max_price}
                       </span>
                     </div>
                   )}
                </div>
              </div>

              {/* Serial Number Section */}
              <div className="space-y-3 md:space-y-4 md:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    IMEI/Serial
                  </Label>
                  <span className="text-xs md:text-sm text-muted-foreground">Opzionale</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SerialNumberInput
                          productId={item.product_id}
                          value={item.serial_number || ""}
                          onSerialNumberUpdate={onSerialNumberUpdate}
                          allProducts={Array.isArray(allProducts) ? allProducts : []}
                          disabled={controlsState.isSerialDisabled}
                        />
                      </div>
                    </TooltipTrigger>
                    {controlsState.serialTooltip && (
                      <TooltipContent>
                        <p>{controlsState.serialTooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Footer with total */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 md:mt-8 pt-4 md:pt-5 border-t border-border bg-muted/30 -mx-4 md:-mx-6 lg:-mx-5 px-4 md:px-6 lg:px-5 py-3 md:py-4 rounded-b-lg gap-2 sm:gap-0">
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Subtotale</span>
                <span className="text-sm md:text-base text-muted-foreground">{item.quantity} × €{item.unit_price.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-lg md:text-xl lg:text-lg font-bold text-foreground">
                  €{(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
