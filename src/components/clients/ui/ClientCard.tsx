import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User, Building, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  name: string;
  type: 'individual' | 'business';
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable client card component for displaying client information
 * Provides consistent styling and behavior across client views
 */
export function ClientCard({
  name,
  type,
  email,
  phone,
  address,
  status,
  notes,
  onEdit,
  onDelete,
  onView,
  className,
  children
}: ClientCardProps) {
  const isActive = status === 'active';

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Status Indicator */}
      <div className="absolute top-3 right-3">
        <Badge 
          variant={isActive ? "default" : "secondary"}
          className={cn(
            isActive ? "bg-green-100 text-green-800 border-green-200" : 
            "bg-gray-100 text-gray-600 border-gray-200"
          )}
        >
          {status}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Client Type Icon */}
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            type === 'business' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
          )}>
            {type === 'business' ? (
              <Building className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-1 pr-16">
              {name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <span className="capitalize">{type}</span>
              {type === 'business' && <span>Client</span>}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{phone}</span>
            </div>
          )}
          {address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-2">{address}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Notes:</p>
            <p className="text-sm line-clamp-2">{notes}</p>
          </div>
        )}

        {/* Custom Content */}
        {children}

        {/* Action Buttons */}
        {(onView || onEdit || onDelete) && (
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex-1"
              >
                View Details
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className={onView ? "" : "flex-1"}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}