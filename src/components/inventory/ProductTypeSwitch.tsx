
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Barcode } from "lucide-react";

interface ProductTypeSwitchProps {
  hasSerial: boolean;
  setHasSerial: (value: boolean) => void;
}

export function ProductTypeSwitch({ hasSerial, setHasSerial }: ProductTypeSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Switch 
          id="has-serial"
          checked={hasSerial}
          onCheckedChange={setHasSerial}
        />
        <Label htmlFor="has-serial">Product has IMEI/Serial Numbers</Label>
      </div>
      <Badge variant={hasSerial ? "default" : "outline"} className="text-xs">
        {hasSerial ? "Phone/Device" : "Accessory"}
      </Badge>
    </div>
  );
}
