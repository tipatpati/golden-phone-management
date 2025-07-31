import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Building, User, TrendingUp, Mail, Phone } from "lucide-react";

interface ClientMetricsProps {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  businessClients: number;
  individualClients: number;
  clientsWithEmail?: number;
  clientsWithPhone?: number;
  className?: string;
}

/**
 * Reusable metrics display component for client overview
 */
export function ClientMetrics({
  totalClients,
  activeClients,
  inactiveClients,
  businessClients,
  individualClients,
  clientsWithEmail = 0,
  clientsWithPhone = 0,
  className
}: ClientMetricsProps) {
  const activePercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
  const businessPercentage = totalClients > 0 ? (businessClients / totalClients) * 100 : 0;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Total Clients */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Total Clients</span>
        </div>
        <div className="text-2xl font-bold">{totalClients.toLocaleString()}</div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs border-green-500 text-green-600">
            {activeClients} Active
          </Badge>
          {inactiveClients > 0 && (
            <Badge variant="outline" className="text-xs border-gray-500 text-gray-600">
              {inactiveClients} Inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Client Types */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Business Clients</span>
        </div>
        <div className="text-2xl font-bold text-blue-600">
          {businessClients.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          {businessPercentage.toFixed(1)}% of total
        </div>
      </div>

      {/* Individual Clients */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">Individual Clients</span>
        </div>
        <div className="text-2xl font-bold text-purple-600">
          {individualClients.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          {(100 - businessPercentage).toFixed(1)}% of total
        </div>
      </div>

      {/* Activity Status */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Activity Rate</span>
        </div>
        <div className="text-2xl font-bold text-green-600">
          {activePercentage.toFixed(1)}%
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span>{clientsWithEmail} with email</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>{clientsWithPhone} with phone</span>
          </div>
        </div>
      </div>
    </div>
  );
}