import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, User, Building, Mail, Phone, MapPin, CreditCard, CalendarDays, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Client } from '@/services/useClients';

interface ClientDetailsDialogProps {
  client: Client;
  trigger?: React.ReactNode;
}

export function ClientDetailsDialog({ client, trigger }: ClientDetailsDialogProps) {
  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const getClientDisplayName = (client: Client) => {
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {client.type === "business" ? (
              <Building className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
            Client Details - {getClientDisplayName(client)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {client.type === "business" ? (
                  <Building className="h-5 w-5 text-purple-600" />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <div className="font-medium">{getClientDisplayName(client)}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Type</div>
                  <Badge variant="outline" className={client.type === 'business' ? 'border-purple-200 text-purple-700' : 'border-blue-200 text-blue-700'}>
                    {client.type === 'business' ? 'Business (B2B)' : 'Individual (B2C)'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant={getStatusColor(client.status)}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </Badge>
                </div>

                {client.type === "business" && client.contact_person && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Contact Person</div>
                    <div>{client.contact_person}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.email && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <div>{client.email}</div>
                  </div>
                )}

                {client.phone && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </div>
                    <div>{client.phone}</div>
                  </div>
                )}

                {client.address && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </div>
                    <div>{client.address}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(client.tax_id || client.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.tax_id && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tax ID
                      </div>
                      <div>{client.tax_id}</div>
                    </div>
                  )}

                  {client.notes && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-muted-foreground">Notes</div>
                      <div className="text-sm bg-muted/50 p-3 rounded-lg">{client.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Created At</div>
                  <div>{client.created_at ? format(new Date(client.created_at), "PPpp") : "N/A"}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                  <div>{client.updated_at ? format(new Date(client.updated_at), "PPpp") : "N/A"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}