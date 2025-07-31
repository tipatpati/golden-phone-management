
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Building } from "lucide-react";
import { type Client } from "@/services";

interface ClientsStatsProps {
  clients: Client[];
}

export const ClientsStats = ({ clients }: ClientsStatsProps) => {
  const individualClients = clients.filter(c => c.type === "individual");
  const businessClients = clients.filter(c => c.type === "business");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="card-glow border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Individual</CardTitle>
          <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-md">
            <User className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{individualClients.length}</div>
          <div className="text-sm text-blue-600">Personal Clients</div>
        </CardContent>
      </Card>
      
      <Card className="card-glow border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Business</CardTitle>
          <div className="rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 shadow-md">
            <Building className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{businessClients.length}</div>
          <div className="text-sm text-purple-600">Business Clients</div>
        </CardContent>
      </Card>
    </div>
  );
};
