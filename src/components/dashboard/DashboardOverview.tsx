
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Users, Calendar } from "lucide-react";
import { useSales } from "@/services";
import { useRepairs } from "@/services";
import { useClients } from "@/services/useClients";

export function DashboardOverview() {
  const navigate = useNavigate();
  const { data: allSales = [] } = useSales();
  const { data: allRepairs = [] } = useRepairs();
  const { data: allClients = [] } = useClients();

  // Type cast the data arrays
  const salesArray = (allSales as any[]) || [];
  const repairsArray = (allRepairs as any[]) || [];
  const clientsArray = (allClients as any[]) || [];

  // Calculate today's metrics
  const today = new Date().toISOString().split('T')[0];
  const todaySales = salesArray.filter(sale => sale.sale_date.startsWith(today));
  const pendingRepairs = repairsArray.filter(repair => 
    repair.status === 'in_progress' || repair.status === 'awaiting_parts'
  );

  // Calculate previous period for trends
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdaySales = salesArray.filter(sale => sale.sale_date.startsWith(yesterdayStr));

  // Calculate this month's new clients
  const thisMonth = new Date();
  const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString();
  const newClientsThisMonth = clientsArray.filter(client => 
    client.created_at && client.created_at >= firstDayOfMonth
  );

  const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const revenueChange = yesterdayRevenue > 0 
    ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : '0';

  const handleCardClick = (title: string) => {
    switch (title) {
      case "Ricavi Totali":
      case "Vendite Totali":
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
  };

  const overviewData = [
    {
      title: "Ricavi Totali",
      value: `€${totalRevenue.toFixed(2)}`,
      change: `${revenueChange}%`,
      isPositive: parseFloat(revenueChange) >= 0,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Vendite Totali",
      value: todaySales.length.toString(),
      change: `${yesterdaySales.length > 0 ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length * 100).toFixed(1) : '0'}%`,
      isPositive: todaySales.length >= yesterdaySales.length,
      icon: ShoppingBag,
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Nuovi Clienti",
      value: newClientsThisMonth.length.toString(),
      change: "+24.5%",
      isPositive: true,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Riparazioni Pendenti",
      value: pendingRepairs.length.toString(),
      change: pendingRepairs.length > 0 ? "Attive" : "Nessuna",
      isPositive: pendingRepairs.length < 10,
      icon: Calendar,
      gradient: "from-orange-500 to-orange-600",
    },
  ];

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
            <CardTitle variant="subtitle" className="text-on-surface-variant">{item.title}</CardTitle>
            <div className={`rounded-full bg-primary p-3 shadow-sm`}>
              <item.icon className="h-5 w-5 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-on-surface mb-2">{item.value}</div>
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
                  <span className="text-gray-500 ml-1 hidden sm:inline">da ieri</span>
                </>
              ) : (
                <span className="text-gray-500">{item.change}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
