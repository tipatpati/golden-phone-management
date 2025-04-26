
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

export function RecentSales() {
  // Sample data - would come from API in real implementation
  const recentSales = [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      amount: "$345.00",
      date: "2 hours ago",
    },
    {
      name: "Jane Smith",
      email: "jane.smith@acme.co",
      amount: "$892.00",
      date: "5 hours ago",
    },
    {
      name: "Robert Johnson",
      email: "robert@example.com",
      amount: "$156.00",
      date: "Yesterday",
    },
    {
      name: "Lisa Brown",
      email: "lisa.brown@example.com",
      amount: "$525.00",
      date: "Yesterday",
    },
    {
      name: "Tech Solutions Inc.",
      email: "accounting@techsolutions.com",
      amount: "$2,456.00",
      date: "2 days ago",
    },
  ];

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>You made 12 sales today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentSales.map((sale, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {sale.name.charAt(0)}
                  </div>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{sale.name}</p>
                  <p className="text-xs text-muted-foreground">{sale.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-medium">{sale.amount}</p>
                <p className="text-xs text-muted-foreground">{sale.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
