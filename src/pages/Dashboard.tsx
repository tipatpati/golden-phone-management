
import React from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SalesOverview } from "@/components/dashboard/SalesOverview";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RepairStatus } from "@/components/dashboard/RepairStatus";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

const Dashboard = () => {
  // PERFORMANCE: Real-time subscriptions are now handled by individual dashboard components
  // Each component manages its own real-time subscription and React Query cache invalidation
  // This approach is more efficient and prevents unnecessary re-renders

  return (
    <PageLayout>
      <PageHeader 
        title="Dashboard"
        subtitle="Bentornato! Ecco cosa sta succedendo nel tuo negozio oggi."
      />

      {/* Key Metrics */}
      <DashboardOverview />

      {/* Sales Overview */}
      <SalesOverview />

      {/* Status Components - Full Width Stacked */}
      <RepairStatus />
      
      <InventoryStatus />
      
      <RecentSales />
    </PageLayout>
  );
};

export default Dashboard;
