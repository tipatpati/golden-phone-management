import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxConfiguration } from "@/components/finances/TaxConfiguration";
import { DiscountManager } from "@/components/finances/DiscountManager";
import { BillCalculator } from "@/components/finances/BillCalculator";
import { FinancialReports } from "@/components/finances/FinancialReports";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLayout } from "@/components/common/PageLayout";
import { Receipt, Calculator, Percent, FileText } from "lucide-react";

export default function Finances() {
  return (
    <PageLayout>
      <PageHeader 
        title="Gestione Finanziaria" 
        subtitle="Gestisci tasse, sconti e calcoli finanziari"
      />

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calcolatore
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tasse
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Sconti
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <BillCalculator />
        </TabsContent>

        <TabsContent value="taxes">
          <TaxConfiguration />
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountManager />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}