import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Settings2, Zap, DollarSign, TrendingUp } from "lucide-react";
import type { UnitEntryForm } from "@/services/inventory/types";
import { toast } from "@/hooks/use-toast";

interface PricingTemplate {
  id: string;
  name: string;
  description: string;
  marginPercentage: number;
  basePrice?: number;
  storageMultipliers?: Record<string, number>;
  conditionMultipliers?: Record<string, number>;
  icon: React.ReactNode;
}

interface PricingTemplateManagerProps {
  units: UnitEntryForm[];
  onUnitsChange: (units: UnitEntryForm[]) => void;
  className?: string;
}

const PRICING_TEMPLATES: PricingTemplate[] = [
  {
    id: "standard",
    name: "Standard Margin",
    description: "20% markup on purchase price",
    marginPercentage: 20,
    icon: <Calculator className="h-4 w-4" />
  },
  {
    id: "premium", 
    name: "Premium Strategy",
    description: "35% markup with storage tiers",
    marginPercentage: 35,
    storageMultipliers: {
      "64": 1.0,
      "128": 1.1,
      "256": 1.2,
      "512": 1.35,
      "1024": 1.5
    },
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: "quick",
    name: "Quick Sale",
    description: "15% markup for fast turnover",
    marginPercentage: 15,
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: "custom",
    name: "Custom Template",
    description: "Define your own pricing rules",
    marginPercentage: 25,
    icon: <Settings2 className="h-4 w-4" />
  }
];

export function PricingTemplateManager({ units, onUnitsChange, className = "" }: PricingTemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMargin, setCustomMargin] = useState<number>(25);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const applyTemplate = (template: PricingTemplate) => {
    const updatedUnits = units.map(unit => {
      if (!unit.price || unit.price === 0) {
        toast({
          title: "Missing Purchase Price",
          description: "Please set purchase prices before applying pricing template",
          variant: "destructive"
        });
        return unit;
      }

      const purchasePrice = unit.price;
      let margin = template.id === "custom" ? customMargin : template.marginPercentage;
      
      // Apply storage multiplier if available
      if (template.storageMultipliers && unit.storage) {
        const storageMultiplier = template.storageMultipliers[unit.storage.toString()] || 1.0;
        margin = margin * storageMultiplier;
      }

      // Calculate prices
      const minPrice = purchasePrice * (1 + margin / 100);
      const maxPrice = minPrice * 1.2; // 20% range above min price

      return {
        ...unit,
        min_price: Math.round(minPrice * 100) / 100,
        max_price: Math.round(maxPrice * 100) / 100
      };
    });

    onUnitsChange(updatedUnits);
    setIsOpen(false);
    
    toast({
      title: "Pricing Applied",
      description: `${template.name} applied to all units with purchase prices`,
      variant: "default"
    });
  };

  const calculateEstimatedProfit = (template: PricingTemplate) => {
    const validUnits = units.filter(u => u.price && u.price > 0);
    if (validUnits.length === 0) return 0;
    
    const totalPurchase = validUnits.reduce((sum, u) => sum + (u.price || 0), 0);
    const margin = template.id === "custom" ? customMargin : template.marginPercentage;
    return (totalPurchase * margin / 100);
  };

  const unitsWithPrices = units.filter(u => u.price && u.price > 0).length;
  const totalUnits = units.filter(u => u.serial?.trim()).length;

  return (
    <div className={`${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Pricing Templates</span>
              {selectedTemplate && (
                <Badge variant="secondary" className="ml-2">
                  {PRICING_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {unitsWithPrices}/{totalUnits} units ready
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0 bg-background border shadow-xl z-50" align="start">
          <Card className="border-0">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-base">Pricing Templates</h3>
              </div>
              
              {unitsWithPrices < totalUnits && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> {totalUnits - unitsWithPrices} units missing purchase prices. 
                    Templates will only apply to units with prices set.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {PRICING_TEMPLATES.map(template => (
                  <div key={template.id} className="space-y-2">
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-border hover:border-blue-300 hover:bg-blue-25'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {template.icon}
                          <div>
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            +{template.id === "custom" ? customMargin : template.marginPercentage}%
                          </div>
                          {unitsWithPrices > 0 && (
                            <div className="text-xs text-muted-foreground">
                              ~€{calculateEstimatedProfit(template).toFixed(0)} profit
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedTemplate === template.id && template.id === "custom" && (
                      <div className="ml-6 p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs font-medium">Custom Margin %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={200}
                          value={customMargin}
                          onChange={(e) => setCustomMargin(parseFloat(e.target.value) || 0)}
                          className="mt-1 h-8"
                          placeholder="25"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    const template = PRICING_TEMPLATES.find(t => t.id === selectedTemplate);
                    if (template) applyTemplate(template);
                  }}
                  disabled={!selectedTemplate || unitsWithPrices === 0}
                  className="flex-1"
                >
                  Apply Template
                </Button>
              </div>
            </div>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}