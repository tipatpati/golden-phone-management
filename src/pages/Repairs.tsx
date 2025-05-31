
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Clock, CheckCircle, AlertCircle, Tool } from "lucide-react";
import { Input } from "@/components/ui/input";

const Repairs = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock repair data
  const repairs = [
    {
      id: "REP-001",
      clientName: "John Doe",
      device: "iPhone 13 Pro",
      imei: "352908764123456",
      issue: "Cracked screen replacement",
      technician: "Mike Johnson",
      status: "in_progress",
      dateCreated: "2024-01-12",
      estimatedCompletion: "2024-01-16",
      cost: 280.00,
      priority: "normal"
    },
    {
      id: "REP-002", 
      clientName: "Tech Solutions Inc.",
      device: "Samsung Galaxy S22",
      imei: "990000862471854",
      issue: "Battery replacement + charging port cleaning",
      technician: "Sarah Wilson",
      status: "awaiting_parts",
      dateCreated: "2024-01-10",
      estimatedCompletion: "2024-01-18",
      cost: 150.00,
      priority: "high"
    },
    {
      id: "REP-003",
      clientName: "Maria Garcia", 
      device: "iPhone 12",
      imei: "352908764123789",
      issue: "Water damage assessment and repair",
      technician: "Mike Johnson",
      status: "completed",
      dateCreated: "2024-01-08",
      estimatedCompletion: "2024-01-15",
      cost: 320.00,
      priority: "urgent"
    },
    {
      id: "REP-004",
      clientName: "David Kim",
      device: "iPad Air",
      imei: "352908764123999",
      issue: "Screen and digitizer replacement",
      technician: "Sarah Wilson", 
      status: "quoted",
      dateCreated: "2024-01-14",
      estimatedCompletion: "2024-01-20",
      cost: 450.00,
      priority: "normal"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary"; 
      case "awaiting_parts": return "destructive";
      case "quoted": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "in_progress": return Tool;
      case "awaiting_parts": return AlertCircle;
      case "quoted": return Clock;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600";
      case "high": return "text-orange-600";
      case "normal": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const filteredRepairs = repairs.filter(repair => 
    repair.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.imei.includes(searchTerm)
  );

  // Stats
  const statusCounts = {
    total: repairs.length,
    in_progress: repairs.filter(r => r.status === "in_progress").length,
    awaiting_parts: repairs.filter(r => r.status === "awaiting_parts").length,
    completed_today: repairs.filter(r => r.status === "completed" && r.estimatedCompletion === "2024-01-15").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repair Management</h2>
          <p className="text-muted-foreground">
            Track device repairs, assign technicians, and manage repair workflows.
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Repair
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <div className="text-sm text-muted-foreground">Total Repairs</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{statusCounts.awaiting_parts}</div>
              <div className="text-sm text-muted-foreground">Awaiting Parts</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statusCounts.completed_today}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, device, repair ID, or IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Repairs List */}
      <div className="space-y-4">
        {filteredRepairs.map((repair) => {
          const StatusIcon = getStatusIcon(repair.status);
          return (
            <Card key={repair.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Repair Info */}
                  <div className="lg:col-span-3">
                    <div className="font-semibold">{repair.id}</div>
                    <div className="text-sm text-muted-foreground">
                      Created: {repair.dateCreated}
                    </div>
                    <div className={`text-xs font-medium ${getPriorityColor(repair.priority)}`}>
                      {repair.priority.toUpperCase()} PRIORITY
                    </div>
                  </div>

                  {/* Client & Device */}
                  <div className="lg:col-span-3">
                    <div className="font-medium">{repair.clientName}</div>
                    <div className="text-sm text-muted-foreground">{repair.device}</div>
                    <div className="text-xs text-muted-foreground">IMEI: {repair.imei}</div>
                  </div>

                  {/* Issue */}
                  <div className="lg:col-span-2">
                    <div className="text-sm">{repair.issue}</div>
                  </div>

                  {/* Technician */}
                  <div className="lg:col-span-1">
                    <div className="text-sm font-medium">{repair.technician}</div>
                  </div>

                  {/* Cost */}
                  <div className="lg:col-span-1">
                    <div className="font-bold">${repair.cost.toFixed(2)}</div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-1">
                    <Badge variant={getStatusColor(repair.status)} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {repair.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* ETA */}
                  <div className="lg:col-span-1">
                    <div className="text-sm text-center">
                      <div className="font-medium">{repair.estimatedCompletion}</div>
                      <div className="text-xs text-muted-foreground">ETA</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRepairs.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No repairs found matching your search.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Repairs;
