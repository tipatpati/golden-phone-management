import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Info, Package } from "lucide-react";

export function UnitPricingGuide() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-900">
          <Euro className="h-4 w-4" />
          Unit-Level Pricing Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">How to manage unit pricing:</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 text-blue-600" />
              <span>Click the <strong>Info button (ℹ️)</strong> on any product to view unit details</span>
            </div>
            <div className="flex items-start gap-2">
              <Euro className="h-3 w-3 mt-0.5 text-blue-600" />
              <span>Click the <strong>Euro button (€)</strong> next to each serial number to set individual pricing</span>
            </div>
            <div className="flex items-start gap-2">
              <Package className="h-3 w-3 mt-0.5 text-blue-600" />
              <span>Each IMEI/serial number can have its own purchase price, min selling price, and max selling price</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-blue-700 mt-3 p-2 bg-blue-100 rounded">
          💡 <strong>Tip:</strong> Product-level prices are now defaults for new units. Individual unit pricing takes priority.
        </div>
      </CardContent>
    </Card>
  );
}