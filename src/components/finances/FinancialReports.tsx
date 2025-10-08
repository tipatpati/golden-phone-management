import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/enhanced-card";
import { Button } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, TrendingDown, Receipt, Euro, Percent, Calendar } from "lucide-react";

// Mock data for financial reports
const taxReports = [
  { name: "IVA 22%", amount: 15420.50, percentage: 22, color: "#8884d8" },
  { name: "IVA 10%", amount: 3250.25, percentage: 10, color: "#82ca9d" },
  { name: "IVA 4%", amount: 890.75, percentage: 4, color: "#ffc658" },
  { name: "Esente IVA", amount: 1250.00, percentage: 0, color: "#ff7c7c" },
];

const discountReports = [
  { name: "Sconto VIP", amount: 2450.50, transactions: 45, color: "#8884d8" },
  { name: "Sconto Quantità", amount: 1890.25, transactions: 32, color: "#82ca9d" },
  { name: "Sconto Promozionale", amount: 1250.00, transactions: 25, color: "#ffc658" },
];

const monthlyFinancialData = [
  { month: "Gen", revenue: 45000, tax: 9900, discounts: 1200 },
  { month: "Feb", revenue: 52000, tax: 11440, discounts: 1560 },
  { month: "Mar", revenue: 48000, tax: 10560, discounts: 1440 },
  { month: "Apr", revenue: 61000, tax: 13420, discounts: 1830 },
  { month: "Mag", revenue: 58000, tax: 12760, discounts: 1740 },
  { month: "Giu", revenue: 67000, tax: 14740, discounts: 2010 },
];

export function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const totalRevenue = monthlyFinancialData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTax = monthlyFinancialData.reduce((sum, item) => sum + item.tax, 0);
  const totalDiscounts = monthlyFinancialData.reduce((sum, item) => sum + item.discounts, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-on-surface">Report Finanziari</h2>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Settimana</SelectItem>
              <SelectItem value="month">Mese</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Anno</SelectItem>
              <SelectItem value="custom">Personalizzato</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Esporta
          </Button>
        </div>
      </div>

      {selectedPeriod === "custom" && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start-date">Data Inizio</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Data Fine</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full">Applica Filtro</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Euro className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Fatturato Totale</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</p>
                  <TrendingUp className="ml-2 h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">IVA Raccolta</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">€{totalTax.toLocaleString()}</p>
                  <TrendingUp className="ml-2 h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Sconti Applicati</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">€{totalDiscounts.toLocaleString()}</p>
                  <TrendingDown className="ml-2 h-4 w-4 text-red-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Margine Netto</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">€{(totalRevenue - totalDiscounts).toLocaleString()}</p>
                  <TrendingUp className="ml-2 h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="taxes">Analisi IVA</TabsTrigger>
          <TabsTrigger value="discounts">Analisi Sconti</TabsTrigger>
          <TabsTrigger value="trends">Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Andamento Mensile</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8884d8" name="Fatturato" />
                  <Bar dataKey="tax" fill="#82ca9d" name="IVA" />
                  <Bar dataKey="discounts" fill="#ffc658" name="Sconti" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione IVA</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taxReports}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {taxReports.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dettaglio Aliquote IVA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxReports.map((tax) => (
                    <div key={tax.name} className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: tax.color }}
                        />
                        <span className="font-medium">{tax.name}</span>
                      </div>
                      <Badge variant="outline">€{tax.amount.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilizzo Sconti</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={discountReports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" name="Importo" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiche Sconti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {discountReports.map((discount) => (
                    <div key={discount.name} className="p-3 bg-surface-container rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{discount.name}</span>
                        <Badge variant="outline">€{discount.amount.toLocaleString()}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {discount.transactions} transazioni
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Media per transazione: €{(discount.amount / discount.transactions).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Temporali</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Fatturato" strokeWidth={2} />
                  <Line type="monotone" dataKey="tax" stroke="#82ca9d" name="IVA" strokeWidth={2} />
                  <Line type="monotone" dataKey="discounts" stroke="#ffc658" name="Sconti" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}