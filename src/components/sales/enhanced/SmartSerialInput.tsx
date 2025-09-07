import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Hash, CheckCircle, AlertTriangle } from "lucide-react";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";

type SmartSerialInputProps = {
  productId: string;
  value: string;
  onSerialNumberUpdate: (productId: string, serialNumber: string) => void;
};

export function SmartSerialInput({
  productId,
  value,
  onSerialNumberUpdate
}: SmartSerialInputProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  
  const { data: allProducts = [] } = useProducts();
  
  // Get current product details
  const currentProduct = useMemo(() => 
    Array.isArray(allProducts) ? allProducts.find(p => p.id === productId) : null,
    [allProducts, productId]
  );

  // Find matching serials from current product
  const matchingSerials = useMemo(() => {
    if (!searchTerm || searchTerm.length < 3 || !currentProduct?.serial_numbers) {
      return [];
    }
    
    const serials = Array.isArray(currentProduct.serial_numbers) 
      ? currentProduct.serial_numbers 
      : [];
      
    return serials
      .filter(serial => 
        serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        serial.slice(-4).includes(searchTerm) ||
        searchTerm.includes(serial.slice(-4))
      )
      .slice(0, 5); // Limit results
  }, [searchTerm, currentProduct]);

  // Validate serial number
  const validateSerial = (serial: string): boolean => {
    if (!serial || !currentProduct?.serial_numbers) return true;
    
    const serials = Array.isArray(currentProduct.serial_numbers) 
      ? currentProduct.serial_numbers 
      : [];
      
    return serials.includes(serial);
  };

  const handleInputChange = (newValue: string) => {
    if (!value) {
      // If no value is set, we're in search mode
      setSearchTerm(newValue);
      setIsSearching(newValue.length >= 3);
    } else {
      // If value is set, we're editing
      onSerialNumberUpdate(productId, newValue);
      
      // Validate
      if (newValue) {
        setValidationState(validateSerial(newValue) ? 'valid' : 'invalid');
      } else {
        setValidationState('idle');
      }
    }
  };

  const handleSerialSelect = (serial: string) => {
    onSerialNumberUpdate(productId, serial);
    setSearchTerm("");
    setIsSearching(false);
    setValidationState('valid');
  };

  const handleClear = () => {
    onSerialNumberUpdate(productId, "");
    setSearchTerm("");
    setIsSearching(false);
    setValidationState('idle');
  };

  const getInputClassName = () => {
    const baseClass = "h-10 font-mono text-sm pr-10";
    
    if (validationState === 'valid') {
      return `${baseClass} border-green-500 bg-green-50 focus:border-green-500`;
    }
    if (validationState === 'invalid') {
      return `${baseClass} border-red-500 bg-red-50 focus:border-red-500`;
    }
    return baseClass;
  };

  const displayValue = value || searchTerm;
  const showDropdown = isSearching && matchingSerials.length > 0;

  return (
    <div className="relative space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        
        <Input
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (!value && searchTerm.length >= 3) {
              setIsSearching(true);
            }
          }}
          placeholder="Cerca IMEI/Serial..."
          className={getInputClassName()}
          style={{ paddingLeft: '2.5rem' }}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {validationState === 'valid' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {validationState === 'invalid' && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {validationState === 'invalid' && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Questo serial non appartiene al prodotto selezionato</span>
        </div>
      )}

      {/* Clear Button */}
      {value && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="text-sm"
        >
          Rimuovi Serial
        </Button>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <div className="p-2 max-h-48 overflow-y-auto">
            <div className="text-xs text-muted-foreground mb-2 px-2">
              Seriali disponibili per questo prodotto:
            </div>
            {matchingSerials.map((serial, index) => (
              <Button
                key={`${serial}-${index}`}
                variant="ghost"
                className="w-full justify-start h-auto p-2 mb-1"
                onClick={() => handleSerialSelect(serial)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-mono text-sm">{serial}</div>
                    <div className="text-xs text-muted-foreground">
                      Ultime 4 cifre: {serial.slice(-4)}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Available Serials Info */}
      {!value && !isSearching && currentProduct?.serial_numbers && (
        <div className="text-xs text-muted-foreground">
          {currentProduct.serial_numbers.length} seriali disponibili per questo prodotto
        </div>
      )}
    </div>
  );
}