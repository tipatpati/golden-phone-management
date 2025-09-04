import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface SerialEntry {
  id: string;
  serial: string;
  color: string;
  batteryLevel: number;
  storage?: number; // GB
  ram?: number; // GB
}

interface SerialNumbersInputProps {
  serialNumbers: string;
  setSerialNumbers: (value: string) => void;
  setStock: (value: string) => void;
}

const COLOR_OPTIONS = [
  "Black", "White", "Silver", "Gold", "Blue", "Red", "Green", 
  "Purple", "Pink", "Gray", "Rose Gold", "Space Gray", "Other"
];

const STORAGE_OPTIONS = [16, 32, 64, 128, 256, 512, 1024];

export function SerialNumbersInput({ serialNumbers, setSerialNumbers, setStock }: SerialNumbersInputProps) {
  const [entries, setEntries] = useState<SerialEntry[]>([]);

// Initialize entries from serialNumbers string
useEffect(() => {
  if (serialNumbers && entries.length === 0) {
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    const initialEntries = lines.map((line, index) => {
      const parts = line.trim().split(/\s+/);
      const tokens = parts.slice(1);
      let colorTokens: string[] = [];
      let batteryLevel = 0;
      let storage: number | undefined = undefined;
      let ram: number | undefined = undefined;

      const STORAGE_SET = new Set([16, 32, 64, 128, 256, 512, 1024]);
      const RAM_SET = new Set([1, 2, 3, 4, 6, 8, 12, 16, 18, 24, 32]);

      tokens.forEach((raw) => {
        const token = raw.replace(/[%GB]/g, '');
        const n = parseInt(token);
        if (!isNaN(n)) {
          if (n >= 0 && n <= 100 && batteryLevel === 0) {
            batteryLevel = n;
          } else if (STORAGE_SET.has(n) && storage === undefined) {
            storage = n;
          } else if (RAM_SET.has(n) && ram === undefined) {
            ram = n;
          } else {
            colorTokens.push(raw);
          }
        } else {
          colorTokens.push(raw);
        }
      });

      return {
        id: `entry-${index}`,
        serial: parts[0] || '',
        color: colorTokens.join(' '),
        batteryLevel,
        storage,
        ram
      };
    });
    
    if (initialEntries.length > 0) {
      setEntries(initialEntries);
    } else {
      // Start with one empty entry
      setEntries([{ id: 'entry-0', serial: '', color: '', batteryLevel: 0 } as SerialEntry]);
    }
  } else if (!serialNumbers && entries.length === 0) {
    // Start with one empty entry
    setEntries([{ id: 'entry-0', serial: '', color: '', batteryLevel: 0 } as SerialEntry]);
  }
}, [serialNumbers, entries.length]);

  // Update serialNumbers string when entries change (but let parent handle stock)
  useEffect(() => {
    const validEntries = entries.filter(entry => entry.serial.trim() !== '');
    const serialString = validEntries
      .map(entry => `${entry.serial}${entry.color ? ` ${entry.color}` : ''}${entry.storage !== undefined ? ` ${entry.storage}GB` : ''}${entry.ram !== undefined ? ` ${entry.ram}GB` : ''}${entry.batteryLevel ? ` ${entry.batteryLevel}%` : ''}`)
      .join('\n');

    // Only update if the string has actually changed to prevent loops
    if (serialString !== serialNumbers) {
      setSerialNumbers(serialString);
    }
  }, [entries, setSerialNumbers, serialNumbers]);

  const addEntry = () => {
    const newEntry: SerialEntry = {
      id: `entry-${Date.now()}`,
      serial: '',
      color: '',
      batteryLevel: 0
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof SerialEntry, value: string | number) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const validEntriesCount = entries.filter(entry => entry.serial.trim() !== '').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">
          Numeri IMEI/Seriali con Colore, Storage, RAM e Batteria *
        </Label>
        <div className="text-sm text-muted-foreground">
          Scorta: {validEntriesCount}
        </div>
      </div>
      
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={entry.id} className="p-3 border rounded-lg space-y-3 lg:space-y-0">
            {/* Mobile/Tablet Layout: Stacked */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Unità #{index + 1}
                </span>
                {entries.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`serial-mobile-${entry.id}`} className="text-xs font-medium mb-1 block">
                    Numero IMEI/Seriale
                  </Label>
                  <Input
                    id={`serial-mobile-${entry.id}`}
                    value={entry.serial}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                      updateEntry(entry.id, 'serial', value);
                    }}
                    placeholder="123456789012345"
                    className="text-sm h-10 font-mono"
                    maxLength={15}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`color-mobile-${entry.id}`} className="text-xs font-medium mb-1 block">
                      Colore
                    </Label>
                    <Select 
                      value={entry.color} 
                      onValueChange={(value) => updateEntry(entry.id, 'color', value)}
                    >
                      <SelectTrigger className="text-sm h-10">
                        <SelectValue placeholder="Colore" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {COLOR_OPTIONS.map(color => (
                          <SelectItem key={color} value={color} className="hover:bg-muted">
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`storage-mobile-${entry.id}`} className="text-xs font-medium mb-1 block">
                      Storage
                    </Label>
                    <Select 
                      value={entry.storage?.toString() || ''} 
                      onValueChange={(value) => updateEntry(entry.id, 'storage', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger className="text-sm h-10">
                        <SelectValue placeholder="GB" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {STORAGE_OPTIONS.map(storage => (
                          <SelectItem key={storage} value={storage.toString()} className="hover:bg-muted">
                            {storage}GB
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`ram-mobile-${entry.id}`} className="text-xs font-medium mb-1 block">
                      RAM (GB)
                    </Label>
                    <Input
                      id={`ram-mobile-${entry.id}`}
                      type="number"
                      min="1"
                      max="32"
                      value={entry.ram?.toString() || ''}
                      onChange={(e) => updateEntry(entry.id, 'ram', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="8"
                      className="text-sm h-10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`battery-mobile-${entry.id}`} className="text-xs font-medium mb-1 block">
                      Batteria (%)
                    </Label>
                    <Input
                      id={`battery-mobile-${entry.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={entry.batteryLevel.toString()}
                      onChange={(e) => updateEntry(entry.id, 'batteryLevel', parseInt(e.target.value) || 0)}
                      placeholder="85"
                      className="text-sm h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout: Grid */}
            <div className="hidden lg:grid lg:grid-cols-14 lg:gap-3 lg:items-end">
              <div className="col-span-1 flex items-end pb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
              
              <div className="col-span-3">
                <Label htmlFor={`serial-desktop-${entry.id}`} className="text-xs font-medium mb-1 block">
                  Numero IMEI/Seriale
                </Label>
                <Input
                  id={`serial-desktop-${entry.id}`}
                  value={entry.serial}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                    updateEntry(entry.id, 'serial', value);
                  }}
                  placeholder="123456789012345"
                  className="text-sm h-10 font-mono"
                  maxLength={15}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor={`color-desktop-${entry.id}`} className="text-xs font-medium mb-1 block">
                  Colore
                </Label>
                <Select 
                  value={entry.color} 
                  onValueChange={(value) => updateEntry(entry.id, 'color', value)}
                >
                  <SelectTrigger className="text-sm h-10">
                    <SelectValue placeholder="Colore" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {COLOR_OPTIONS.map(color => (
                      <SelectItem key={color} value={color} className="hover:bg-muted">
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor={`storage-desktop-${entry.id}`} className="text-xs font-medium mb-1 block">
                  Storage
                </Label>
                <Select 
                  value={entry.storage?.toString() || ''} 
                  onValueChange={(value) => updateEntry(entry.id, 'storage', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger className="text-sm h-10">
                    <SelectValue placeholder="GB" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {STORAGE_OPTIONS.map(storage => (
                      <SelectItem key={storage} value={storage.toString()} className="hover:bg-muted">
                        {storage}GB
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor={`ram-desktop-${entry.id}`} className="text-xs font-medium mb-1 block">
                  RAM (GB)
                </Label>
                <Input
                  id={`ram-desktop-${entry.id}`}
                  type="number"
                  min="1"
                  max="32"
                  value={entry.ram?.toString() || ''}
                  onChange={(e) => updateEntry(entry.id, 'ram', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="8"
                  className="text-sm h-10"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor={`battery-desktop-${entry.id}`} className="text-xs font-medium mb-1 block">
                  Batteria (%)
                </Label>
                <Input
                  id={`battery-desktop-${entry.id}`}
                  type="number"
                  min="0"
                  max="100"
                  value={entry.batteryLevel.toString()}
                  onChange={(e) => updateEntry(entry.id, 'batteryLevel', parseInt(e.target.value) || 0)}
                  placeholder="85"
                  className="text-sm h-10"
                />
              </div>
              
              <div className="col-span-1 flex items-end pb-2">
                {entries.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="h-10 w-10 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Button
        type="button"
        variant="outline"
        onClick={addEntry}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Aggiungi Altra Unità
      </Button>
      
      {/* Enhanced guidance */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs font-medium text-amber-800 mb-2">💡 Serial Number Guidelines:</p>
        <div className="text-xs text-amber-700 space-y-1">
           <p><strong>IMEI Format:</strong> 15 digits following ITU-T standard (e.g., 123456789012345)</p>
          <p><strong>Serial Format:</strong> Alphanumeric (e.g., ABC123DEF456)</p>
          <p><strong>Storage &amp; RAM:</strong> Enter storage and RAM capacity for each unit</p>
          <p><strong>EAN13 Barcodes:</strong> Generated when serial has 8+ digits</p>
          <p><strong>Stock Management:</strong> One entry = one unit in stock</p>
        </div>
      </div>
    </div>
  );
}