
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Management
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">Loading sales...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Management
            </h2>
            <p className="text-red-500 mt-3 text-lg">Error loading sales. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sales Management
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Manage sales transactions, process refunds, and track performance with comprehensive analytics.
              </p>
            </div>
            <div className="flex-shrink-0">
              <NewSaleDialog />
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Total Revenue</CardTitle>
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-blue-900">${totalRevenue.toFixed(2)}</div>
              <p className="text-sm text-blue-600 font-medium">from {totalSales} total sales</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 uppercase tracking-wider">Total Sales</CardTitle>
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-3 shadow-lg">
                <Receipt className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-green-900">{totalSales}</div>
              <p className="text-sm text-green-600 font-medium">completed transactions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider">Average Sale</CardTitle>
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-purple-900">${avgSaleValue.toFixed(2)}</div>
              <p className="text-sm text-purple-600 font-medium">per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by sale number, client name, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button variant="outline" className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all">
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales List */}
        <div className="space-y-4">
          {sales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white hover:bg-gray-50/50 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                  {/* Sale Info */}
                  <div className="xl:col-span-3 space-y-1">
                    <div className="font-bold text-lg text-gray-900">{sale.sale_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(sale.sale_date), "MMM dd, yyyy")} • {format(new Date(sale.sale_date), "HH:mm")}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="xl:col-span-2 space-y-1">
                    <div className="font-semibold text-gray-900">{getClientName(sale.client)}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {sale.client?.email || "No email provided"}
                    </div>
                  </div>

                  {/* Salesperson */}
                  <div className="xl:col-span-2 space-y-1">
                    <div className="font-semibold text-gray-900">{sale.salesperson?.username || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">Sales Representative</div>
                  </div>

                  {/* Items Summary */}
                  <div className="xl:col-span-2 space-y-1">
                    <div className="text-sm space-y-1">
                      {sale.sale_items?.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-gray-700 font-medium">
                          {item.quantity}× {item.product?.name || "Product"}
                        </div>
                      )) || <div className="text-muted-foreground">No items</div>}
                      {sale.sale_items && sale.sale_items.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{sale.sale_items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment & Total */}
                  <div className="xl:col-span-2 space-y-1">
                    <div className="font-bold text-xl text-gray-900">${sale.total_amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground capitalize font-medium">
                      {sale.payment_method.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="xl:col-span-1 flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-3">
                    <Badge variant={getStatusColor(sale.status)} className="text-xs font-semibold px-3 py-1">
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sales.length === 0 && (
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {searchTerm ? "No sales found" : "No sales yet"}
                  </h3>
                  <p className="text-muted-foreground text-base max-w-md mx-auto">
                    {searchTerm 
                      ? "Try adjusting your search criteria or clear the search to see all sales." 
                      : "Get started by creating your first sale transaction."
                    }
                  </p>
                </div>
                {!searchTerm && (
                  <NewSaleDialog />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Sales;
