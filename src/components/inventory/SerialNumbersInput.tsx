
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SerialNumbersInputProps {
  serialNumbers: string;
  setSerialNumbers: (value: string) => void;
  setStock: (value: string) => void;
}

export function SerialNumbersInput({ serialNumbers, setSerialNumbers, setStock }: SerialNumbersInputProps) {
  // Auto-calculate stock from number of IMEI lines
  useEffect(() => {
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    setStock(lines.length.toString());
  }, [serialNumbers, setStock]);

  const calculateStock = () => {
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    return lines.length;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="serial-numbers">
        IMEI/Serial Numbers with Battery Level and Color * (One per line)
      </Label>
      <Textarea 
        id="serial-numbers"
        value={serialNumbers}
        onChange={(e) => setSerialNumbers(e.target.value)}
        placeholder="352908764123456 85 Blue&#10;352908764123457 92 Red&#10;352908764123458 78 Black"
        className="h-32"
      />
      <p className="text-xs text-muted-foreground">
        Enter IMEI/Serial numbers with battery level and color, one per line (e.g., "352908764123456 85 Blue"). Stock: {calculateStock()}
      </p>
    </div>
  );
}
