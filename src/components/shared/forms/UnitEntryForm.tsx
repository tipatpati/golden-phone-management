/**
 * Unified Unit Entry Form Component
 * Shared between inventory and supplier modules for consistent unit data entry
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutocompleteInput } from "@/components/shared/AutocompleteInput";
import { Plus, Trash2 } from "lucide-react";
import type { UnitEntryForm } from "@/services/inventory/types";
import { STORAGE_OPTIONS } from "@/services/inventory/types";
import { useFilteredColorSuggestions } from "@/hooks/useColorSuggestions";

interface UnitEntryFormProps {
  entries: UnitEntryForm[];
  setEntries: (entries: UnitEntryForm[]) => void;
  onStockChange?: (count: number) => void;
  showPricing?: boolean;
  title?: string;
  className?: string;
}

export function UnitEntryForm({ 
  entries, 
  setEntries, 
  onStockChange,
  showPricing = true,
  title = "Product Units",
  className = ""
}: UnitEntryFormProps) {
  const { colorSuggestions } = useFilteredColorSuggestions();
  
  const addEntry = () => {
    const newEntry: UnitEntryForm = {
      serial: "",
      battery_level: 0,
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    onStockChange?.(updated.filter(e => e.serial?.trim()).length);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onStockChange?.(updated.filter(e => e.serial?.trim()).length);
  };

  const updateEntry = (index: number, field: keyof UnitEntryForm, value: string | number | undefined) => {
    const updated = entries.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setEntries(updated);
    onStockChange?.(updated.filter(e => e.serial?.trim()).length);
  };

  const validEntriesCount = entries.filter(e => e.serial?.trim()).length;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">{title}</Label>
        <div className="text-sm text-muted-foreground">Units: {validEntriesCount}</div>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={`unit-entry-${index}`} className="p-4 border border-border rounded-lg bg-muted/5 space-y-4 transition-colors hover:bg-muted/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Unit #{index + 1}</span>
                {entries.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeEntry(index)} 
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Serial Number - Full width */}
              <div>
                <Label className="text-xs font-medium mb-1 block">Serial Number / IMEI *</Label>
                <Input
                  value={entry.serial || ''}
                  onChange={(e) => {
                    // Allow alphanumeric for flexibility
                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                    updateEntry(index, 'serial', value);
                  }}
                  placeholder="123456789012345"
                  className="text-sm h-10 font-mono"
                  maxLength={20}
                />
              </div>

              {/* Device attributes - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Color</Label>
                  <AutocompleteInput
                    value={entry.color || ''}
                    onChange={(value) => updateEntry(index, 'color', value)}
                    suggestions={colorSuggestions}
                    placeholder="Black / White / Gold..."
                    className="text-sm h-10"
                    maxSuggestions={8}
                    minQueryLength={0}
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1 block">Battery (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={entry.battery_level ?? ''}
                    onChange={(e) => updateEntry(index, 'battery_level', e.target.value === '' ? undefined : parseInt(e.target.value))}
                    placeholder="85"
                    className="text-sm h-10"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1 block">Storage (GB)</Label>
                  <Select 
                    value={entry.storage?.toString() || ''} 
                    onValueChange={(value) => updateEntry(index, 'storage', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger className="text-sm h-10">
                      <SelectValue placeholder="Select GB" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {STORAGE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()} className="hover:bg-muted">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1 block">RAM (GB)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    value={entry.ram ?? ''}
                    onChange={(e) => updateEntry(index, 'ram', e.target.value === '' ? undefined : parseInt(e.target.value))}
                    placeholder="8"
                    className="text-sm h-10"
                  />
                </div>
              </div>

              {/* Pricing - Only show if enabled */}
              {showPricing && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Purchase Price (€) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={entry.price ?? ''}
                      onChange={(e) => updateEntry(index, 'price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      placeholder="250.00"
                      className="text-sm h-10"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-1 block">Min Selling Price (€) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={entry.min_price ?? ''}
                      onChange={(e) => updateEntry(index, 'min_price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      placeholder="300.00"
                      className="text-sm h-10"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-1 block">Max Selling Price (€) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={entry.max_price ?? ''}
                      onChange={(e) => updateEntry(index, 'max_price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      placeholder="400.00"
                      className="text-sm h-10"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addEntry} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Unit
      </Button>
    </div>
  );
}