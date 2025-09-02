import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ThermalLabelPreview } from "./ThermalLabelPreview";
import { generateThermalLabels } from "./utils/thermalLabelUtils";
import { ThermalLabelData, ThermalLabelOptions } from "./types";

interface ThermalLabelGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: ThermalLabelData[];
  companyName?: string;
}

export function ThermalLabelGenerator({
  open,
  onOpenChange,
  labels,
  companyName = "GOLDEN PHONE SRL"
}: ThermalLabelGeneratorProps) {
  const [options, setOptions] = useState<ThermalLabelOptions>({
    copies: 1,
    includePrice: true,
    includeBarcode: true,
    includeCompany: true,
    includeCategory: true,
    format: "standard"
  });
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Error",
        description: "Please allow popups to print labels",
        variant: "destructive"
      });
      return;
    }

    const htmlContent = generateThermalLabels(labels, { ...options, companyName });
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    const totalLabels = labels.length * options.copies;
    toast({
      title: "Print Prepared",
      description: `Preparing to print ${totalLabels} thermal labels`
    });
  };

  const updateOption = <K extends keyof ThermalLabelOptions>(
    key: K,
    value: ThermalLabelOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  if (labels.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Labels to Print</DialogTitle>
            <DialogDescription>
              Please select products with serial numbers to generate thermal labels.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Thermal Label Generator (5cm × 6cm - Portrait)
          </DialogTitle>
          <DialogDescription>
            Generate individual thermal labels for {labels.length} unit{labels.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="copies">Copies per unit</Label>
                <Input
                  id="copies"
                  type="number"
                  min="1"
                  max="10"
                  value={options.copies}
                  onChange={(e) => updateOption('copies', parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label>Label format</Label>
                <Select 
                  value={options.format} 
                  onValueChange={(value: "standard" | "compact") => updateOption('format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Include information</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-company"
                    checked={options.includeCompany}
                    onCheckedChange={(checked) => updateOption('includeCompany', checked === true)}
                  />
                  <Label htmlFor="include-company" className="text-sm">
                    Company name
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-price"
                    checked={options.includePrice}
                    onCheckedChange={(checked) => updateOption('includePrice', checked === true)}
                  />
                  <Label htmlFor="include-price" className="text-sm">
                    Price
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-barcode"
                    checked={options.includeBarcode}
                    onCheckedChange={(checked) => updateOption('includeBarcode', checked === true)}
                  />
                  <Label htmlFor="include-barcode" className="text-sm">
                    Barcode
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-category"
                    checked={options.includeCategory}
                    onCheckedChange={(checked) => updateOption('includeCategory', checked === true)}
                  />
                  <Label htmlFor="include-category" className="text-sm">
                    Category
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print {labels.length * options.copies} Labels
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-4">
              <Label>Label Preview</Label>
              <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto">
                <ThermalLabelPreview
                  label={labels[0]}
                  options={{ ...options, companyName }}
                />
                {labels.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing preview for first unit. All units will have similar format.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}