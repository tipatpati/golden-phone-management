import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateProduct, useCategories } from "@/services/useProducts";
import { toast } from "@/components/ui/sonner";

export function SimpleAddProductDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    category_id: 1,
    price: "",
    min_price: "",
    max_price: "",
    stock: "",
    threshold: "5",
    description: "",
    supplier: "",
    barcode: "",
    has_serial: false,
    serial_numbers: ""
  });

  const createProduct = useCreateProduct();
  const { data: categories = [] } = useCategories();

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 SimpleAddProductDialog submitting:", formData);

    // Basic validation
    if (!formData.brand.trim() || !formData.model.trim() || !formData.price) {
      toast.error("Please fill in Brand, Model, and Price");
      return;
    }

    // Prepare serial numbers array
    const serialArray = formData.has_serial && formData.serial_numbers.trim()
      ? formData.serial_numbers.split('\n').map(s => s.trim()).filter(s => s !== "")
      : [];

    // Prepare data for API
    const productData = {
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: formData.year ? parseInt(formData.year) : undefined,
      category_id: formData.category_id,
      price: parseFloat(formData.price),
      min_price: formData.min_price ? parseFloat(formData.min_price) : 0,
      max_price: formData.max_price ? parseFloat(formData.max_price) : 0,
      stock: formData.has_serial ? serialArray.length : parseInt(formData.stock) || 0,
      threshold: parseInt(formData.threshold) || 5,
      description: formData.description.trim() || undefined,
      supplier: formData.supplier.trim() || undefined,
      barcode: formData.barcode.trim() || undefined,
      has_serial: formData.has_serial,
      serial_numbers: formData.has_serial ? serialArray : undefined,
    };

    console.log("📦 Final product data:", productData);

    try {
      await createProduct.mutateAsync(productData);
      console.log("✅ Product created successfully");
      
      // Reset form
      setFormData({
        brand: "",
        model: "",
        year: "",
        category_id: 1,
        price: "",
        min_price: "",
        max_price: "",
        stock: "",
        threshold: "5",
        description: "",
        supplier: "",
        barcode: "",
        has_serial: false,
        serial_numbers: ""
      });
      
      setOpen(false);
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("❌ Error creating product:", error);
      toast.error("Failed to create product. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Aggiungi Prodotto
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Prodotto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="e.g. Apple, Samsung"
                required
              />
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="e.g. iPhone 15, Galaxy S24"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                placeholder="e.g. 2024"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category_id.toString()} 
                onValueChange={(value) => handleInputChange("category_id", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="min_price">Min Price</Label>
              <Input
                id="min_price"
                type="number"
                step="0.01"
                value={formData.min_price}
                onChange={(e) => handleInputChange("min_price", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="max_price">Max Price</Label>
              <Input
                id="max_price"
                type="number"
                step="0.01"
                value={formData.max_price}
                onChange={(e) => handleInputChange("max_price", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Stock & Serial Numbers */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_serial"
              checked={formData.has_serial}
              onCheckedChange={(checked) => handleInputChange("has_serial", checked)}
            />
            <Label htmlFor="has_serial">This product has serial numbers</Label>
          </div>

          {formData.has_serial ? (
            <div>
              <Label htmlFor="serial_numbers">Serial Numbers (one per line)</Label>
              <Textarea
                id="serial_numbers"
                value={formData.serial_numbers}
                onChange={(e) => handleInputChange("serial_numbers", e.target.value)}
                placeholder="Enter serial numbers, one per line..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Stock will be calculated automatically from the number of serial numbers
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="threshold">Low Stock Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => handleInputChange("threshold", e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange("barcode", e.target.value)}
                placeholder="Scan or enter barcode"
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange("supplier", e.target.value)}
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Product description..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={createProduct.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createProduct.isPending}
            >
              {createProduct.isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}