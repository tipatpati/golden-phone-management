
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

export function SerialNumbersInput({ serialNumbers, setSerialNumbers, setStock }: SerialNumbersInputProps) {
  const [entries, setEntries] = useState<SerialEntry[]>([]);

  // Initialize entries from serialNumbers string
  useEffect(() => {
    if (serialNumbers && entries.length === 0) {
      const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
      const initialEntries = lines.map((line, index) => {
        const parts = line.trim().split(/\s+/);
        return {
          id: `entry-${index}`,
          serial: parts[0] || '',
          color: parts[1] || '',
          batteryLevel: parts[2] ? parseInt(parts[2]) : 0
        };
      });
      
      if (initialEntries.length > 0) {
        setEntries(initialEntries);
      } else {
        // Start with one empty entry
        setEntries([{ id: 'entry-0', serial: '', color: '', batteryLevel: 0 }]);
      }
    } else if (!serialNumbers && entries.length === 0) {
      // Start with one empty entry
      setEntries([{ id: 'entry-0', serial: '', color: '', batteryLevel: 0 }]);
    }
  }, [serialNumbers, entries.length]);

  // Update serialNumbers string and stock when entries change
  useEffect(() => {
    const validEntries = entries.filter(entry => entry.serial.trim() !== '');
    const serialString = validEntries
      .map(entry => `${entry.serial}${entry.color ? ` ${entry.color}` : ''}${entry.batteryLevel ? ` ${entry.batteryLevel}%` : ''}`)
      .join('\n');
    
    setSerialNumbers(serialString);
    setStock(validEntries.length.toString());
  }, [entries, setSerialNumbers, setStock]);

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
          Numeri IMEI/Seriali con Colore e Batteria *
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
                  <Label htmlFor={`serial-mobile-${entry.id}`} className="text-xs">
                    Numero IMEI/Seriale
                  </Label>
                  <Input
                    id={`serial-mobile-${entry.id}`}
                    value={entry.serial}
                    onChange={(e) => updateEntry(entry.id, 'serial', e.target.value)}
                    placeholder="352908764123456"
                    className="text-sm h-9"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`color-mobile-${entry.id}`} className="text-xs">
                    Colore
                  </Label>
                  <Select 
                    value={entry.color} 
                    onValueChange={(value) => updateEntry(entry.id, 'color', value)}
                  >
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue placeholder="Seleziona colore" />
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
                  <Label htmlFor={`battery-mobile-${entry.id}`} className="text-xs">
                    Livello Batteria (%)
                  </Label>
                  <Input
                    id={`battery-mobile-${entry.id}`}
                    type="number"
                    min="0"
                    max="100"
                    value={entry.batteryLevel.toString()}
                    onChange={(e) => updateEntry(entry.id, 'batteryLevel', parseInt(e.target.value) || 0)}
                    placeholder="85"
                    className="text-sm h-9"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Layout: Grid */}
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center">
              <div className="col-span-1 text-sm font-medium text-muted-foreground">
                #{index + 1}
              </div>
              
              <div className="col-span-5">
                <Label htmlFor={`serial-desktop-${entry.id}`} className="text-xs">
                  Numero IMEI/Seriale
                </Label>
                <Input
                  id={`serial-desktop-${entry.id}`}
                  value={entry.serial}
                  onChange={(e) => updateEntry(entry.id, 'serial', e.target.value)}
                  placeholder="352908764123456"
                  className="text-sm h-9"
                />
              </div>
              
              <div className="col-span-3">
                <Label htmlFor={`color-desktop-${entry.id}`} className="text-xs">
                  Colore
                </Label>
                <Select 
                  value={entry.color} 
                  onValueChange={(value) => updateEntry(entry.id, 'color', value)}
                >
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Seleziona colore" />
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
                <Label htmlFor={`battery-desktop-${entry.id}`} className="text-xs">
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
                  className="text-sm h-9"
                />
              </div>
              
              <div className="col-span-1">
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
      
      <p className="text-xs text-muted-foreground">
        Aggiungi singole unità con i loro numeri IMEI/Seriali, colori e livelli di batteria. La scorta verrà calcolata automaticamente in base al numero di voci valide.
      </p>
    </div>
  );
}
