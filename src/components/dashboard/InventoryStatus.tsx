
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

type InventoryItem = {
  name: string;
  sku: string;
  inStock: number;
  threshold: number;
  category: string;
};

export function InventoryStatus() {
  // Sample data - would come from API in real implementation
  const lowStockItems: InventoryItem[] = [
    {
      name: "iPhone 13 Pro Case",
      sku: "ACC-CASE-IP13P",
      inStock: 3,
      threshold: 10,
      category: "Accessories",
    },
    {
      name: "USB-C Cable (1m)",
      sku: "ACC-CABLE-USBC1",
      inStock: 5,
      threshold: 20,
      category: "Accessories",
    },
    {
      name: "Screen Protector (Universal)",
      sku: "ACC-SCRN-UNI",
      inStock: 2,
      threshold: 15,
      category: "Accessories",
    },
    {
      name: "Samsung Galaxy S22",
      sku: "PHN-SSG-S22-BLK",
      inStock: 1,
      threshold: 5,
      category: "Phones",
    },
  ];

  const getStockLevel = (current: number, threshold: number) => {
    const percentage = (current / threshold) * 100;
    if (percentage <= 20) return { color: "bg-red-500", level: "Critical" };
    if (percentage <= 50) return { color: "bg-yellow-500", level: "Low" };
    return { color: "bg-green-500", level: "Good" };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Low Stock Items</CardTitle>
        <Button variant="outline" size="sm">
          Order Stock
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStockItems.map((item) => {
            const stockStatus = getStockLevel(item.inStock, item.threshold);
            
            return (
              <div key={item.sku} className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <Badge variant={stockStatus.level === "Critical" ? "destructive" : "outline"}>
                    {item.inStock} left
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(item.inStock / item.threshold) * 100}
                    className="h-2"
                    indicatorClassName={stockStatus.color}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.inStock}/{item.threshold}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
