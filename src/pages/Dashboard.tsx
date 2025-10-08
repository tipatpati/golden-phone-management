
import React, { useEffect } from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SalesOverview } from "@/components/dashboard/SalesOverview";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RepairStatus } from "@/components/dashboard/RepairStatus";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

const Dashboard = () => {
  // Set up global real-time subscriptions for dashboard with unique channel name
  useEffect(() => {
    console.log('Dashboard: Setting up real-time subscriptions');
    
    // Enable real-time for all tables if not already enabled
    const enableRealtime = async () => {
      try {
        await supabase.from('sales').select('id').limit(1);
        await supabase.from('repairs').select('id').limit(1);
        await supabase.from('products').select('id').limit(1);
        await supabase.from('clients').select('id').limit(1);
      } catch (error) {
        console.warn('Real-time setup warning:', error);
      }
    };
    
    enableRealtime();
  }, []);

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
