import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, Minus, Receipt, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
}

interface Discount {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
}

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId: string;
  discountId?: string;
}

interface BillCalculation {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalTax: number;
  total: number;
  items: (BillItem & {
    lineTotal: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
  })[];
}

// Mock data - in real app, this would come from your finance configuration
const taxRates: TaxRate[] = [
  { id: "1", name: "IVA Standard (22%)", rate: 22 },
  { id: "2", name: "IVA Ridotta (10%)", rate: 10 },
  { id: "3", name: "IVA Agevolata (4%)", rate: 4 },
  { id: "4", name: "Esente IVA (0%)", rate: 0 },
];

const discounts: Discount[] = [
  { id: "1", name: "Sconto VIP (15%)", type: "percentage", value: 15 },
  { id: "2", name: "Sconto Quantità (10%)", type: "percentage", value: 10 },
  { id: "3", name: "Sconto Promozionale (€50)", type: "fixed", value: 50 },
];

export function BillCalculator() {
  const [items, setItems] = useState<BillItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRateId: "1",
    }
  ]);
  const [calculation, setCalculation] = useState<BillCalculation | null>(null);
  const { toast } = useToast();

  const addItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRateId: "1",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateBill = () => {
    const calculatedItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      
      // Calculate discount
      let discountAmount = 0;
      if (item.discountId) {
        const discount = discounts.find(d => d.id === item.discountId);
        if (discount) {
          if (discount.type === "percentage") {
            discountAmount = lineTotal * (discount.value / 100);
          } else {
            discountAmount = Math.min(discount.value, lineTotal);
          }
        }
      }

      const taxableAmount = lineTotal - discountAmount;
      
      // Calculate tax
      const taxRate = taxRates.find(t => t.id === item.taxRateId);
      const taxAmount = taxableAmount * (taxRate?.rate || 0) / 100;
      
      const finalAmount = taxableAmount + taxAmount;

      return {
        ...item,
        lineTotal,
        discountAmount,
        taxAmount,
        finalAmount,
      };
    });

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalDiscount = calculatedItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const taxableAmount = subtotal - totalDiscount;
    const totalTax = calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = calculatedItems.reduce((sum, item) => sum + item.finalAmount, 0);

    setCalculation({
      subtotal,
      totalDiscount,
      taxableAmount,
      totalTax,
      total,
      items: calculatedItems,
    });
  };

  const generateReceipt = () => {
    if (!calculation) {
      toast({
        title: "Errore",
        description: "Calcola prima il totale",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would generate a PDF or print receipt
    toast({
      title: "Ricevuta Generata",
      description: "La ricevuta è stata generata con successo",
    });
  };

  useEffect(() => {
    calculateBill();
  }, [items]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcolatore Fatture e Ricevute
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Articoli</h3>
              <Button onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Articolo
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={item.id} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="lg:col-span-2">
                      <Label>Descrizione</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Descrizione articolo"
                      />
                    </div>
                    <div>
                      <Label>Quantità</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Prezzo Unitario (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Aliquota IVA</Label>
                      <Select
                        value={item.taxRateId}
                        onValueChange={(value) => updateItem(item.id, "taxRateId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taxRates.map(rate => (
                            <SelectItem key={rate.id} value={rate.id}>
                              {rate.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Sconto</Label>
                        <Select
                          value={item.discountId || ""}
                          onValueChange={(value) => updateItem(item.id, "discountId", value || undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Nessuno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nessuno</SelectItem>
                            {discounts.map(discount => (
                              <SelectItem key={discount.id} value={discount.id}>
                                {discount.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {items.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {calculation && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Riepilogo Calcolo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotale:</span>
                    <span>€{calculation.subtotal.toFixed(2)}</span>
                  </div>
                  {calculation.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Sconto Totale:</span>
                      <span>-€{calculation.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Imponibile:</span>
                    <span>€{calculation.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA Totale:</span>
                    <span>€{calculation.totalTax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTALE:</span>
                    <span>€{calculation.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Dettaglio per Articolo</h4>
                  {calculation.items.map((item, index) => (
                    <div key={item.id} className="p-3 bg-surface-container rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium">{item.description || `Articolo ${index + 1}`}</div>
                        <div className="text-muted-foreground">
                          {item.quantity} x €{item.unitPrice.toFixed(2)} = €{item.lineTotal.toFixed(2)}
                        </div>
                        {item.discountAmount > 0 && (
                          <div className="text-green-600">
                            Sconto: -€{item.discountAmount.toFixed(2)}
                          </div>
                        )}
                        <div>IVA: €{item.taxAmount.toFixed(2)}</div>
                        <div className="font-semibold">Totale: €{item.finalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={generateReceipt}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Genera Ricevuta
                </Button>
                <Button variant="outline" onClick={generateReceipt}>
                  <Download className="h-4 w-4 mr-2" />
                  Esporta PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}