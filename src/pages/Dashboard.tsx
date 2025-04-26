
import React from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RepairStatus } from "@/components/dashboard/RepairStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business today.
          </p>
        </div>
        <Tabs defaultValue="today" className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="today" className="min-w-[80px]">Today</TabsTrigger>
            <TabsTrigger value="week" className="min-w-[80px]">Week</TabsTrigger>
            <TabsTrigger value="month" className="min-w-[80px]">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <DashboardOverview />

      <div className="grid gap-6 lg:grid-cols-4">
        <RecentSales />
        <RepairStatus />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InventoryStatus />
        <Card className="col-span-1 md:col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Your best salespeople this month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Performance data will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Import card components for the placeholder section
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
