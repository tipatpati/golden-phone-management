import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchBrands, useModelsByBrand } from "@/services/brands/BrandsReactQueryService";

interface ProductFormFieldsProps {
  brand: string;
  setBrand: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  stock: string;
  setStock: (value: string) => void;
  threshold: string;
  setThreshold: (value: string) => void;
  batteryLevel: string;
  setBatteryLevel: (value: string) => void;
  categories?: { id: number; name: string; }[];
  requiresSerial?: boolean;
}

// Category mapping - you'll need to adjust these IDs based on your Django backend
const CATEGORY_OPTIONS = [
  { id: 1, name: "Phones" },
  { id: 2, name: "Accessories" },
  { id: 3, name: "Spare Parts" },
  { id: 4, name: "Protection" },
];

export function ProductFormFields({
  brand, setBrand,
  model, setModel,
  year, setYear,
  category, setCategory,
  price, setPrice,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  stock, setStock,
  threshold, setThreshold,
  batteryLevel, setBatteryLevel,
  categories,
  requiresSerial = true
}: ProductFormFieldsProps) {
  const categoryOptions = categories || CATEGORY_OPTIONS;
  
  // Get brands and models from dedicated database
  const { data: searchedBrands = [] } = useSearchBrands(brand || '');
  const { data: modelsByBrand = [] } = useModelsByBrand(brand);
  
  // Convert to suggestion arrays
  const brandSuggestions = searchedBrands.map(b => b.name);
  const modelSuggestions = modelsByBrand.map(m => m.name);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-brand">Brand *</Label>
          <AutocompleteInput
            value={brand}
            onChange={setBrand}
            suggestions={brandSuggestions}
            placeholder="Apple, Samsung, Google..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-model">Model *</Label>
          <AutocompleteInput
            value={model}
            onChange={setModel}
            suggestions={modelSuggestions}
            placeholder="iPhone 13 Pro Max, Galaxy S23..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-year">Year (optional)</Label>
          <Input
            id="product-year"
            type="number"
            min="1900"
            max="2099"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-category">Category *</Label>
          <select 
            id="product-category"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">Select a category</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name} {cat.id === 2 ? "(Serial optional)" : "(Serial required)"}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-price">Base Price (€) *</Label>
          <Input 
            id="product-price" 
            type="number" 
            step="0.01" 
            min="0" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            placeholder="899.99" 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-min-price">Minimum Selling Price (€) *</Label>
          <Input 
            id="product-min-price" 
            type="number" 
            step="0.01" 
            min="0" 
            value={minPrice} 
            onChange={(e) => setMinPrice(e.target.value)} 
            placeholder="799.99" 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-max-price">Maximum Selling Price (€) *</Label>
          <Input 
            id="product-max-price" 
            type="number" 
            step="0.01" 
            min="0" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(e.target.value)} 
            placeholder="999.99" 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-stock">Stock (Auto-calculated) *</Label>
          <Input 
            id="product-stock" 
            type="number" 
            min="0" 
            value={stock} 
            readOnly
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Stock is automatically calculated from the number of IMEI/Serial entries
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-threshold">Low Stock Threshold *</Label>
          <Input 
            id="product-threshold" 
            type="number" 
            min="0" 
            value={threshold} 
            onChange={(e) => setThreshold(e.target.value)} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product-battery-level">Battery Level (%) *</Label>
          <Input 
            id="product-battery-level" 
            type="number" 
            min="0"
            max="100" 
            value={batteryLevel} 
            onChange={(e) => setBatteryLevel(e.target.value)} 
            placeholder="85" 
            required 
          />
          <p className="text-xs text-muted-foreground">
            Enter the current battery level (0-100%)
          </p>
        </div>
      </div>
      
      {!requiresSerial && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This category allows products without serial numbers. You can leave the serial numbers field empty if needed.
          </p>
        </div>
      )}
    </>
  );
}

// Export the category mapping for use in AddProductForm
export { CATEGORY_OPTIONS };