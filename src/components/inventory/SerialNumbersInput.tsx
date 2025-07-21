
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SerialNumbersInputProps {
  serialNumbers: string;
  setSerialNumbers: (value: string) => void;
  stock: string;
}

export function SerialNumbersInput({ serialNumbers, setSerialNumbers, stock }: SerialNumbersInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="serial-numbers">
        IMEI/Serial Numbers with Battery Level * (One per line, must match stock quantity)
      </Label>
      <Textarea 
        id="serial-numbers"
        value={serialNumbers}
        onChange={(e) => setSerialNumbers(e.target.value)}
        placeholder="352908764123456 85&#10;352908764123457 92&#10;352908764123458 78"
        className="h-32"
      />
      <p className="text-xs text-muted-foreground">
        Enter {stock} IMEI/Serial numbers with battery level, one per line (e.g., "352908764123456 85")
      </p>
    </div>
  );
}
