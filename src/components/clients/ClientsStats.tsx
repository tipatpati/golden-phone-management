
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/updated-card";
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
      <Card variant="elevated" className="bg-surface-container-high border border-outline-variant/30 shadow-lg md-motion-smooth hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-on-surface">Individual</CardTitle>
          <div className="rounded-full bg-primary/10 p-2.5 ring-1 ring-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight gradient-tech-text">{individualClients.length}</div>
          <div className="text-sm text-on-surface-variant mt-1">Personal Clients</div>
        </CardContent>
      </Card>
      
      <Card variant="elevated" className="bg-surface-container-high border border-outline-variant/30 shadow-lg md-motion-smooth hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-on-surface">Business</CardTitle>
          <div className="rounded-full bg-secondary/10 p-2.5 ring-1 ring-secondary/20">
            <Building className="h-4 w-4 text-secondary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight gradient-accent" style={{
            background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--tertiary)))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>{businessClients.length}</div>
          <div className="text-sm text-on-surface-variant mt-1">Business Clients</div>
        </CardContent>
      </Card>
    </div>
  );
};
