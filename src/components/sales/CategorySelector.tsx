import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Smartphone, Shield, Tablet, Laptop, Cable, Plug, Battery, Usb } from "lucide-react";

interface Category {
  id: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const categories: Category[] = [
  { id: 1, name: "Smartphone", icon: Smartphone, color: "bg-[#4F46E5] hover:bg-[#4338CA]" },
  { id: 2, name: "SIM", icon: Shield, color: "bg-[#DC2626] hover:bg-[#B91C1C]" }, 
  { id: 3, name: "Cover", icon: Shield, color: "bg-[#059669] hover:bg-[#047857]" },
  { id: 4, name: "Glass", icon: Shield, color: "bg-[#0891B2] hover:bg-[#0E7490]" },
  { id: 5, name: "Tablet", icon: Tablet, color: "bg-[#CA8A04] hover:bg-[#A16207]" },
  { id: 6, name: "Laptop", icon: Laptop, color: "bg-[#DC2626] hover:bg-[#B91C1C]" },
  { id: 7, name: "Cavo", icon: Cable, color: "bg-[#166534] hover:bg-[#14532D]" },
  { id: 8, name: "Alimentatore", icon: Plug, color: "bg-[#6B7280] hover:bg-[#4B5563]" },
  { id: 9, name: "Caricatore", icon: Battery, color: "bg-[#166534] hover:bg-[#14532D]" },
  { id: 10, name: "Power Charger", icon: Usb, color: "bg-[#6B7280] hover:bg-[#4B5563]" }
];

interface CategorySelectorProps {
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
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
                <span className="text-sm font-medium">{category.name}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}