
import React from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SalesOverview } from "@/components/dashboard/SalesOverview";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RepairStatus } from "@/components/dashboard/RepairStatus";
import { RecentSales } from "@/components/dashboard/RecentSales";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening in your store today.
        </p>
      </div>

      {/* Key Metrics */}
      <DashboardOverview />

      {/* Sales Overview */}
      <SalesOverview />

      {/* Grid Layout for Status Components */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InventoryStatus />
        <RepairStatus />
        <RecentSales />
      </div>
    </div>
  );
};

export default Dashboard;
