import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Smartphone, Shield, Tablet, Laptop, Cable, Plug, Battery, Usb, Package, Headphones, Wrench } from "lucide-react";
import { useCategories } from "@/services/inventory/InventoryReactQueryService";

interface Category {
  id: number;
  name: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Smartphone": Smartphone,
  "Phones": Smartphone,
  "Tablets": Tablet,
  "Tablet": Tablet,
  "Computers": Laptop,
  "Laptop": Laptop,
  "Accessories": Shield,
  "Audio": Headphones,
  "Electronics": Plug,
  "Cable": Cable,
  "Charger": Battery,
  "SIM": Shield,
  "Cover": Shield,
  "Glass": Shield,
  "Cavo": Cable,
  "Alimentatore": Plug,
  "Caricatore": Battery,
  "Power Charger": Usb,
  "Repairs": Wrench,
};

// Color mapping for categories
const categoryColors: Record<string, string> = {
  "Smartphone": "bg-primary hover:bg-primary/90",
  "Phones": "bg-primary hover:bg-primary/90",
  "Tablets": "bg-warning hover:bg-warning/90",
  "Tablet": "bg-warning hover:bg-warning/90",
  "Computers": "bg-info hover:bg-info/90",
  "Laptop": "bg-info hover:bg-info/90",
  "Accessories": "bg-destructive hover:bg-destructive/90", 
  "Audio": "bg-accent hover:bg-accent/90",
  "Electronics": "bg-primary hover:bg-primary/90", // Better visibility
  "Cable": "bg-success hover:bg-success/90",
  "Charger": "bg-warning hover:bg-warning/90",
  "Repairs": "bg-destructive hover:bg-destructive/90",
};

// Display name mapping to standardize labels shown in UI
const categoryDisplayNames: Record<string, string> = {
  "Tablet": "Tablets",
  "Tablets": "Tablets",
};

interface CategorySelectorProps {
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  const { data: dbCategories, isLoading } = useCategories();

  // Transform database categories to include icons and colors
  const categories: Category[] = React.useMemo(() => {
    if (!dbCategories) return [];
    
    return Array.isArray(dbCategories) ? dbCategories.map((dbCategory) => ({
      id: dbCategory.id,
      name: dbCategory.name,
      displayName: categoryDisplayNames[dbCategory.name] || dbCategory.name,
      icon: categoryIcons[dbCategory.name] || Package,
      color: categoryColors[dbCategory.name] || "bg-muted hover:bg-muted/90"
    })) : [];
  }, [dbCategories]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Label className="text-base font-medium">Categorie Prodotti</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[80px] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Categorie Prodotti</Label>
      <RadioGroup
        value={selectedCategory?.toString() || "all"}
        onValueChange={(value) => onCategoryChange(value === "all" ? null : parseInt(value))}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
      >
        {/* All Categories Option */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="category-all" className="sr-only" />
          <Label
            htmlFor="category-all"
            className={`
              flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer 
              transition-all duration-200 min-h-[80px] text-center w-full
              ${selectedCategory === null 
                ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <div className="text-2xl mb-1">📱</div>
            <span className="text-sm font-medium">Tutti</span>
          </Label>
        </div>

        {/* Category Options */}
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <div key={category.id} className="flex items-center space-x-2">
              <RadioGroupItem value={category.id.toString()} id={`category-${category.id}`} className="sr-only" />
              <Label
                htmlFor={`category-${category.id}`}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer 
                  transition-all duration-200 min-h-[80px] text-center w-full
                  ${isSelected 
                    ? `${category.color} text-white shadow-md border-transparent` 
                    : 'border-muted hover:border-primary/50 hover:bg-muted/50 bg-background'
                  }
                `}
              >
                <IconComponent className={`h-6 w-6 mb-2 ${isSelected ? 'text-white' : 'text-primary'}`} />
                <span className="text-sm font-medium">{category.displayName}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}