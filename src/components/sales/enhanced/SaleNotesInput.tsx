import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

type SaleNotesInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SaleNotesInput({ value, onChange }: SaleNotesInputProps) {
  const maxLength = 500;
  const remainingChars = maxLength - value.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Note aggiuntive
        </Label>
        <Badge variant={remainingChars < 50 ? "destructive" : "secondary"}>
          {remainingChars} caratteri rimanenti
        </Badge>
      </div>
      
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Aggiungi note sulla vendita, condizioni speciali, garanzie estese, ecc..."
        className="min-h-[100px] resize-none"
        maxLength={maxLength}
      />
      
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Le note verranno incluse nella ricevuta e nei documenti di vendita
        </div>
      )}
    </div>
  );
}