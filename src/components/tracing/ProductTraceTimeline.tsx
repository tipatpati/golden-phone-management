import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, ShoppingCart, Calendar, User, Euro, Hash } from 'lucide-react';
import { TraceTimelineEvent } from '@/services/tracing/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProductTraceTimelineProps {
  events: TraceTimelineEvent[];
  className?: string;
}

export function ProductTraceTimeline({ events, className }: ProductTraceTimelineProps) {
  if (events.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No timeline events found</p>
        </div>
      </Card>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'acquisition':
        return Package;
      case 'modification':
        return Edit;
      case 'sale':
        return ShoppingCart;
      default:
        return Calendar;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'acquisition':
        return 'bg-blue-500';
      case 'modification':
        return 'bg-yellow-500';
      case 'sale':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatEventDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return new Date(dateString).toLocaleDateString();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold mb-4">Product Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        {events.map((event, index) => {
          const Icon = getEventIcon(event.type);
          const isLast = index === events.length - 1;
          
          return (
            <div key={event.id} className="relative flex gap-4 pb-6">
              {/* Timeline dot */}
              <div className={cn(
                "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background",
                getEventColor(event.type)
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              
              {/* Event content */}
              <div className="flex-1 min-w-0">
                <Card className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatEventDate(event.date)}
                      </div>
                    </div>
                    
                    {/* Event-specific details */}
                    {event.type === 'acquisition' && event.data && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {event.data.supplier_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Supplier: {event.data.supplier_name}</span>
                          </div>
                        )}
                        {event.data.transaction_number && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span>TX: {event.data.transaction_number}</span>
                          </div>
                        )}
                        {event.data.unit_cost && (
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            <span>Cost: €{Number(event.data.unit_cost).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {event.type === 'sale' && event.data && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {event.data.customer_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Customer: {event.data.customer_name}</span>
                          </div>
                        )}
                        {event.data.sale_number && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span>Sale: {event.data.sale_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          <span>Price: €{Number(event.data.sold_price).toFixed(2)}</span>
                        </div>
                        {event.data.salesperson_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Sold by: {event.data.salesperson_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {event.type === 'modification' && event.data && (
                      <div className="text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {event.data.operation_type}
                        </Badge>
                        {event.data.note && (
                          <p className="mt-1 text-muted-foreground">{event.data.note}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}