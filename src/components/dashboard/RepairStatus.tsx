
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RepairStatusType = "In Progress" | "Awaiting Parts" | "Ready for Pickup" | "Completed";

type RepairItem = {
  id: string;
  client: string;
  device: string;
  status: RepairStatusType;
  technician: string;
  dueDate: string;
};

export function RepairStatus() {
  // Sample data - would come from API in real implementation
  const repairs: RepairItem[] = [
    {
      id: "REP-2023-001",
      client: "Michael Wilson",
      device: "iPhone 13 Pro",
      status: "In Progress",
      technician: "Alex T.",
      dueDate: "Today",
    },
    {
      id: "REP-2023-002",
      client: "Laura Garcia",
      device: "MacBook Air",
      status: "Awaiting Parts",
      technician: "Sam J.",
      dueDate: "Apr 28",
    },
    {
      id: "REP-2023-003",
      client: "David Kim",
      device: "iPad Pro",
      status: "Ready for Pickup",
      technician: "Alex T.",
      dueDate: "Apr 27",
    },
    {
      id: "REP-2023-004",
      client: "Sarah Johnson",
      device: "Samsung Galaxy S22",
      status: "In Progress",
      technician: "Chris M.",
      dueDate: "Apr 29",
    },
    {
      id: "REP-2023-005",
      client: "Tech Solutions Inc.",
      device: "Dell XPS 15 (x3)",
      status: "Awaiting Parts",
      technician: "Sam J.",
      dueDate: "Apr 30",
    },
  ];

  const getStatusColor = (status: RepairStatusType) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Awaiting Parts":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Ready for Pickup":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Active Repairs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium">Client</th>
                <th className="pb-3 pr-4 font-medium">Device</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Technician</th>
                <th className="pb-3 pr-4 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((repair) => (
                <tr key={repair.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">{repair.id}</td>
                  <td className="py-3 pr-4">{repair.client}</td>
                  <td className="py-3 pr-4">{repair.device}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                        repair.status
                      )}`}
                    >
                      {repair.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{repair.technician}</td>
                  <td className="py-3 pr-4">{repair.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
