
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Receipt, Edit, Trash2, TrendingUp, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewSaleDialog } from "@/components/sales/NewSaleDialog";
import { useSales } from "@/services/useSales";
import { format } from "date-fns";

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: sales = [], isLoading, error } = useSales(searchTerm);

  // Calculate total revenue
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalSales = sales.length;
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "refunded": return "destructive";
      case "pending": return "secondary";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const getClientName = (client: any) => {
    if (!client) return "Walk-in Customer";
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-0">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sales Management
          </h2>
          <p className="text-muted-foreground mt-2">Loading sales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-0">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sales Management
          </h2>
          <p className="text-red-500 mt-2">Error loading sales. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Management
            </h2>
            <p className="text-muted-foreground mt-2">
              Manage sales transactions, process refunds, and track performance.
            </p>
          </div>
          <NewSaleDialog />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Revenue</CardTitle>
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-md">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-blue-600 mt-1">from {totalSales} sales</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Sales</CardTitle>
            <div className="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-2.5 shadow-md">
              <Receipt className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalSales}</div>
            <p className="text-xs text-green-600 mt-1">transactions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Average Sale</CardTitle>
            <div className="rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 shadow-md">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">${avgSaleValue.toFixed(2)}</div>
            <p className="text-xs text-purple-600 mt-1">per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by sale number or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <div className="space-y-4">
        {sales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Sale Info */}
                <div className="lg:col-span-3">
                  <div className="font-semibold text-gray-900">{sale.sale_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(sale.sale_date), "MMM dd, yyyy")} at {format(new Date(sale.sale_date), "HH:mm")}
                  </div>
                </div>

                {/* Client */}
                <div className="lg:col-span-2">
                  <div className="font-medium text-gray-900">{getClientName(sale.client)}</div>
                  <div className="text-sm text-muted-foreground">
                    {sale.client?.email || "No email"}
                  </div>
                </div>

                {/* Salesperson */}
                <div className="lg:col-span-2">
                  <div className="font-medium text-gray-900">{sale.salesperson?.username || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground">Salesperson</div>
                </div>

                {/* Items */}
                <div className="lg:col-span-2">
                  <div className="text-sm">
                    {sale.sale_items?.map((item, index) => (
                      <div key={index} className="text-gray-700">
                        {item.quantity}x {item.product?.name || "Product"}
                      </div>
                    )) || "No items"}
                  </div>
                </div>

                {/* Total */}
                <div className="lg:col-span-1">
                  <div className="font-bold text-lg text-gray-900">${sale.total_amount.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {sale.payment_method.replace('_', ' ')}
                  </div>
                </div>

                {/* Status */}
                <div className="lg:col-span-1">
                  <Badge variant={getStatusColor(sale.status)}>
                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="lg:col-span-1">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sales.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-muted-foreground">
                {searchTerm ? "No sales found matching your search." : "No sales yet. Create your first sale!"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sales;
