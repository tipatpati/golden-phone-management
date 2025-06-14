
import React, { useEffect } from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SalesOverview } from "@/components/dashboard/SalesOverview";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RepairStatus } from "@/components/dashboard/RepairStatus";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  // Set up global real-time subscriptions for dashboard
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
    <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-0">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="text-muted-foreground mt-2">
          Bentornato! Ecco cosa sta succedendo nel tuo negozio oggi.
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
