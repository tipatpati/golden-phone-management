
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormFieldsProps {
  name: string;
  setName: (value: string) => void;
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
  description: string;
  setDescription: (value: string) => void;
  barcode: string;
  setBarcode: (value: string) => void;
  hasSerial?: boolean;
  setHasSerial?: (value: boolean) => void;
  serialNumbers?: string[];
  setSerialNumbers?: (value: string[]) => void;
  categories?: { id: number; name: string; }[];
}

// Category mapping - you'll need to adjust these IDs based on your Django backend
const CATEGORY_OPTIONS = [
  { id: 1, name: "Phones" },
  { id: 2, name: "Accessories" },
  { id: 3, name: "Spare Parts" },
  { id: 4, name: "Protection" },
];

export function ProductFormFields({
  name, setName,
  category, setCategory,
  price, setPrice,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  stock, setStock,
  threshold, setThreshold,
  description, setDescription,
  barcode, setBarcode,
  categories
}: ProductFormFieldsProps) {
  const categoryOptions = categories || CATEGORY_OPTIONS;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Product Name *</Label>
          <Input 
            id="product-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="iPhone 13 Pro" 
            required 
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
                {cat.name}
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
          <Label htmlFor="product-stock">Initial Stock *</Label>
          <Input 
            id="product-stock" 
            type="number" 
            min="0" 
            value={stock} 
            onChange={(e) => setStock(e.target.value)} 
            required 
          />
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
          <Label htmlFor="product-barcode">Barcode (Optional)</Label>
          <Input 
            id="product-barcode" 
            value={barcode} 
            onChange={(e) => setBarcode(e.target.value)} 
            placeholder="8901234567890" 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="product-description">Description (Optional)</Label>
        <Textarea 
          id="product-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description"
          className="h-20"
        />
      </div>
    </>
  );
}

// Export the category mapping for use in AddProductForm
export { CATEGORY_OPTIONS };
