import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { UnitEntryForm } from "./forms/types";
import { STORAGE_OPTIONS } from "./forms/types";

interface SerialNumbersInputProps {
  entries: UnitEntryForm[];
  setEntries: (entries: UnitEntryForm[]) => void;
  setStock: (value: string) => void; // kept for backward compatibility
}

export function SerialNumbersInput({ entries, setEntries, setStock }: SerialNumbersInputProps) {
  // Handlers
  const addEntry = () => {
    const newEntry: UnitEntryForm = {
      serial: "",
      battery_level: 0,
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    setStock(String(updated.filter(e => e.serial.trim()).length));
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    setStock(String(updated.filter(e => e.serial.trim()).length));
  };

  const updateEntry = (index: number, field: keyof UnitEntryForm, value: string | number | undefined) => {
    const updated = entries.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setEntries(updated);
    setStock(String(updated.filter(e => e.serial.trim()).length));
  };

  const validEntriesCount = entries.filter(e => e.serial.trim() !== "").length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Unità (IMEI/SN + attributi) *</Label>
        <div className="text-sm text-muted-foreground">Scorta: {validEntriesCount}</div>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={`unit-entry-${index}`} className="p-4 border border-border rounded-lg bg-muted/5 space-y-4 transition-colors hover:bg-muted/10">
            {/* Mobile layout */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Unità #{index + 1}</span>
                {entries.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeEntry(index)} className="h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium mb-1 block">IMEI/Seriale</Label>
                  <Input
                    value={entry.serial}
                    onChange={(e) => {
                      // Only allow digits for IMEI
                      const numericValue = e.target.value.replace(/\D/g, '');
                      updateEntry(index, 'serial', numericValue);
                    }}
                    placeholder="123456789012345"
                    className="text-sm h-10 font-mono"
                    maxLength={15}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Colore</Label>
                    <Input
                      value={entry.color || ''}
                      onChange={(e) => updateEntry(index, 'color', e.target.value)}
                      placeholder="Black / Titanium / ..."
                      className="text-sm h-10"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-1 block">Batteria (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={entry.battery_level ?? 0}
                      onChange={(e) => updateEntry(index, 'battery_level', e.target.value === '' ? undefined : parseInt(e.target.value))}
                      placeholder="85"
                      className="text-sm h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Storage (GB)</Label>
                    <Select 
                      value={entry.storage?.toString() || ''} 
                      onValueChange={(value) => updateEntry(index, 'storage', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger className="text-sm h-10">
                        <SelectValue placeholder="GB" />
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

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Prezzo di Acquisto (€) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={entry.price ?? ''}
                      onChange={(e) => updateEntry(index, 'price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      placeholder="250.00"
                      className="text-sm h-10"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Prezzo Min (€) *</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={entry.min_price ?? ''}
                        onChange={(e) => updateEntry(index, 'min_price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        placeholder="300.00"
                        className="text-sm h-10"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1 block">Prezzo Max (€) *</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={entry.max_price ?? ''}
                        onChange={(e) => updateEntry(index, 'max_price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        placeholder="400.00"
                        className="text-sm h-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="space-y-4">
              <div className="col-span-1 flex items-center">
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
              </div>

              <div className="col-span-3">
                <Label className="text-xs font-medium mb-1 block">IMEI/Seriale *</Label>
                <Input
                  value={entry.serial}
                  onChange={(e) => {
                    // Only allow digits for IMEI
                    const numericValue = e.target.value.replace(/\D/g, '');
                    updateEntry(index, 'serial', numericValue);
                  }}
                  placeholder="123456789012345"
                  className="text-sm h-10 font-mono"
                  maxLength={15}
                />
              </div>

              <div className="col-span-1">
                <Label className="text-xs font-medium mb-1 block">Colore</Label>
                <Input
                  value={entry.color || ''}
                  onChange={(e) => updateEntry(index, 'color', e.target.value)}
                  placeholder="Black"
                  className="text-sm h-10"
                />
              </div>

              <div className="col-span-1">
                <Label className="text-xs font-medium mb-1 block">Batteria *</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={entry.battery_level ?? 0}
                  onChange={(e) => updateEntry(index, 'battery_level', e.target.value === '' ? undefined : parseInt(e.target.value))}
                  placeholder="85"
                  className="text-sm h-10"
                />
              </div>

              <div className="col-span-1">
                <Label className="text-xs font-medium mb-1 block">Storage (GB)</Label>
                <Select 
                  value={entry.storage?.toString() || ''} 
                  onValueChange={(value) => updateEntry(index, 'storage', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger className="text-sm h-10">
                    <SelectValue placeholder="GB" />
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

              <div className="col-span-1">
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

              <div className="col-span-2">
                <Label className="text-xs font-medium mb-1 block">Prezzo Acquisto *</Label>
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

              <div className="col-span-2">
                <Label className="text-xs font-medium mb-1 block">Prezzo Min *</Label>
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

              <div className="col-span-2">
                <Label className="text-xs font-medium mb-1 block">Prezzo Max *</Label>
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

              <div className="col-span-1 flex items-end">
                {entries.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeEntry(index)} className="h-10 w-10 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addEntry} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Aggiungi Altra Unità
      </Button>
    </div>
  );
}