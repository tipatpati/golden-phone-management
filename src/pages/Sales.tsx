
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Receipt, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewSaleDialog } from "@/components/sales/NewSaleDialog";
import { useSales } from "@/services/useSales";
import { format } from "date-fns";

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: sales = [], isLoading, error } = useSales(searchTerm);

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Sales Management</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading sales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Sales Management</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-500">Error loading sales. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Management</h2>
          <p className="text-muted-foreground">
            Manage sales transactions, process refunds, and track performance.
          </p>
        </div>
        <NewSaleDialog />
      </div>

      {/* Filters and Search */}
      <Card>
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
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <div className="space-y-4">
        {sales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Sale Info */}
                <div className="lg:col-span-3">
                  <div className="font-semibold">{sale.sale_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(sale.sale_date), "MMM dd, yyyy")} at {format(new Date(sale.sale_date), "HH:mm")}
                  </div>
                </div>

                {/* Client */}
                <div className="lg:col-span-2">
                  <div className="font-medium">{getClientName(sale.client)}</div>
                  <div className="text-sm text-muted-foreground">
                    {sale.client?.email || "No email"}
                  </div>
                </div>

                {/* Salesperson */}
                <div className="lg:col-span-2">
                  <div className="font-medium">{sale.salesperson?.username || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground">Salesperson</div>
                </div>

                {/* Items */}
                <div className="lg:col-span-2">
                  <div className="text-sm">
                    {sale.sale_items?.map((item, index) => (
                      <div key={index}>
                        {item.quantity}x {item.product?.name || "Product"}
                      </div>
                    )) || "No items"}
                  </div>
                </div>

                {/* Total */}
                <div className="lg:col-span-1">
                  <div className="font-bold text-lg">${sale.total_amount.toFixed(2)}</div>
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
                    <Button variant="ghost" size="icon">
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
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
