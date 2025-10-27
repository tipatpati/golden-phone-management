
import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/updated-card";
import { ArrowUpRight, ArrowDownRight, Euro, ShoppingBag, Users, Calendar } from "lucide-react";
import { useDashboardMetrics, calculatePercentageChange } from "@/hooks/useDashboardMetrics";

export const DashboardOverview = React.memo(function DashboardOverview() {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useDashboardMetrics();

  // Memoize handleCardClick to prevent recreating on every render
  const handleCardClick = useCallback((title: string) => {
    switch (title) {
      case "Ricavi Totali":
      case "Garanzie Totali":
        navigate("/sales");
        break;
      case "Nuovi Clienti":
        navigate("/clients");
        break;
      case "Riparazioni Pendenti":
        navigate("/repairs");
        break;
      default:
        break;
    }
  }, [navigate]);

  // Memoize calculated data to prevent recalculation on every render
  const overviewData = useMemo(() => {
    if (!metrics) return [];

    const revenueChange = calculatePercentageChange(metrics.today_revenue, metrics.yesterday_revenue);
    const salesChange = calculatePercentageChange(metrics.today_sales_count, metrics.yesterday_sales_count);
    const clientChange = calculatePercentageChange(metrics.new_clients_this_month, metrics.new_clients_last_month);

    return [
      {
        title: "Ricavi Totali",
        value: `€${metrics.today_revenue.toFixed(2)}`,
        change: `${revenueChange}%`,
        isPositive: parseFloat(revenueChange) >= 0,
        icon: Euro,
        gradient: "from-blue-500 to-blue-600",
      },
      {
        title: "Garanzie Totali",
        value: metrics.today_sales_count.toString(),
        change: `${salesChange}%`,
        isPositive: parseFloat(salesChange) >= 0,
        icon: ShoppingBag,
        gradient: "from-green-500 to-green-600",
      },
      {
        title: "Nuovi Clienti",
        value: metrics.new_clients_this_month.toString(),
        change: `${clientChange}%`,
        isPositive: parseFloat(clientChange) >= 0,
        icon: Users,
        gradient: "from-purple-500 to-purple-600",
      },
      {
        title: "Riparazioni Pendenti",
        value: metrics.pending_repairs_count.toString(),
        change: metrics.pending_repairs_count > 0 ? "Attive" : "Nessuna",
        isPositive: metrics.pending_repairs_count < 10,
        icon: Calendar,
        gradient: "from-orange-500 to-orange-600",
      },
    ];
  }, [metrics]);

  // Show loading skeleton while fetching data
  if (isLoading || !metrics) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} variant="elevated" className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="h-4 w-24 bg-surface-container-high rounded" />
              <div className="h-12 w-12 bg-surface-container-high rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-surface-container-high rounded mb-2" />
              <div className="h-3 w-16 bg-surface-container-high rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {overviewData.map((item, index) => (
        <Card
          key={index}
          variant="elevated"
          interactive={true}
          onClick={() => handleCardClick(item.title)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle level={4} className="text-muted-foreground">{item.title}</CardTitle>
            <div className={`rounded-full bg-primary p-3 shadow-sm`}>
              <item.icon className="h-5 w-5 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground mb-2">{item.value}</div>
            <div className="flex items-center text-xs">
              {typeof item.change === 'string' && item.change.includes('%') ? (
                <>
                  {item.isPositive ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500 flex-shrink-0" />
                  )}
                  <span className={item.isPositive ? "text-green-500" : "text-red-500"}>
                    {item.change}
                  </span>
                   <span className="text-muted-foreground ml-1 hidden sm:inline">da ieri</span>
                </>
              ) : (
                <span className="text-muted-foreground">{item.change}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
