
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock sales data
  const recentSales = [
    {
      id: "SAL-001",
      date: "2024-01-15",
      time: "14:30",
      client: "John Doe",
      salesperson: "Alice Smith",
      items: [
        { name: "iPhone 13 Pro", quantity: 1, price: 999.99 },
        { name: "Phone Case", quantity: 1, price: 29.99 }
      ],
      total: 1029.98,
      status: "completed",
      paymentMethod: "card"
    },
    {
      id: "SAL-002", 
      date: "2024-01-15",
      time: "13:15",
      client: "Tech Solutions Inc.",
      salesperson: "Bob Wilson",
      items: [
        { name: "Samsung Galaxy S22", quantity: 3, price: 899.99 }
      ],
      total: 2699.97,
      status: "completed",
      paymentMethod: "bank_transfer"
    },
    {
      id: "SAL-003",
      date: "2024-01-15", 
      time: "11:45",
      client: "Maria Garcia",
      salesperson: "Alice Smith",
      items: [
        { name: "AirPods Pro", quantity: 1, price: 199.99 }
      ],
      total: 199.99,
      status: "refunded",
      paymentMethod: "cash"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "refunded": return "destructive";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  const filteredSales = recentSales.filter(sale => 
    sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.salesperson.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, sale ID, or salesperson..."
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
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Sale Info */}
                <div className="lg:col-span-3">
                  <div className="font-semibold">{sale.id}</div>
                  <div className="text-sm text-muted-foreground">
                    {sale.date} at {sale.time}
                  </div>
                </div>

                {/* Client */}
                <div className="lg:col-span-2">
                  <div className="font-medium">{sale.client}</div>
                  <div className="text-sm text-muted-foreground">Client</div>
                </div>

                {/* Salesperson */}
                <div className="lg:col-span-2">
                  <div className="font-medium">{sale.salesperson}</div>
                  <div className="text-sm text-muted-foreground">Salesperson</div>
                </div>

                {/* Items */}
                <div className="lg:col-span-2">
                  <div className="text-sm">
                    {sale.items.map((item, index) => (
                      <div key={index}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="lg:col-span-1">
                  <div className="font-bold text-lg">${sale.total.toFixed(2)}</div>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sales found matching your search.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sales;
