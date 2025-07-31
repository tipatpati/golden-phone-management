import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText,
  Calendar,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientDetailsViewProps {
  client: {
    type: 'individual' | 'business';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    notes?: string;
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
  };
  className?: string;
  actions?: React.ReactNode;
}

/**
 * Comprehensive client details view component
 * Displays all client information in a structured format
 */
export function ClientDetailsView({ client, className, actions }: ClientDetailsViewProps) {
  const getClientName = () => {
    if (client.type === 'business') {
      return client.company_name || 'Unnamed Business';
    }
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed Client';
  };

  const isActive = client.status === 'active';

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Client Type Icon */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full",
              client.type === 'business' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
            )}>
              {client.type === 'business' ? (
                <Building className="h-6 w-6" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            
            <div>
              <CardTitle className="text-xl">{getClientName()}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={isActive ? "default" : "secondary"}
                  className={cn(
                    isActive ? "bg-green-100 text-green-800 border-green-200" : 
                    "bg-gray-100 text-gray-600 border-gray-200"
                  )}
                >
                  {client.status}
                </Badge>
                <span className="text-sm text-muted-foreground capitalize">
                  {client.type} Client
                </span>
              </div>
            </div>
          </div>
          
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Business Information */}
        {client.type === 'business' && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Company Name:</span>
                <p className="font-medium">{client.company_name || 'Not provided'}</p>
              </div>
              {client.contact_person && (
                <div>
                  <span className="text-muted-foreground">Contact Person:</span>
                  <p className="font-medium">{client.contact_person}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Individual Information */}
        {client.type === 'individual' && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">First Name:</span>
                <p className="font-medium">{client.first_name || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Name:</span>
                <p className="font-medium">{client.last_name || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="font-medium">Contact Information</h3>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{client.email}</p>
                  <span className="text-xs text-muted-foreground">Email Address</span>
                </div>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{client.phone}</p>
                  <span className="text-xs text-muted-foreground">Phone Number</span>
                </div>
              </div>
            )}
            
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{client.address}</p>
                  <span className="text-xs text-muted-foreground">Address</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tax Information */}
        {client.tax_id && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Tax Information
              </h3>
              <div>
                <span className="text-muted-foreground">Tax ID / VAT Number:</span>
                <p className="font-medium font-mono">{client.tax_id}</p>
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {client.notes && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          </>
        )}

        {/* Timestamps */}
        {(client.created_at || client.updated_at) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Record Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {client.created_at && (
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {client.updated_at && (
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p className="font-medium">
                      {new Date(client.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}