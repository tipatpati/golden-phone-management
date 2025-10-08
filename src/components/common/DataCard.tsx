import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/updated-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/updated-button";
import { Edit2, Trash2 } from "lucide-react";

interface DataField {
  label: string;
  value: string | number | React.ReactNode;
  className?: string;
}

interface ActionButton {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "filled" | "outlined" | "destructive";
  className?: string;
}

interface DataCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  fields: DataField[];
  actions?: ActionButton[];
  headerActions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataCard({
  title,
  subtitle,
  icon,
  badge,
  fields,
  actions = [],
  headerActions,
  onClick,
  className = ""
}: DataCardProps) {
  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 touch-target border-l-4 border-l-primary/20 hover:border-l-primary ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2 md:pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {icon && (
              <div className="p-1.5 md:p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-base text-on-surface truncate leading-tight">
                {title}
              </h3>
              {subtitle && (
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-xs md:text-xs text-muted-foreground">
                    {subtitle}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Combined Badge and Header Actions */}
          <div className="flex items-center gap-2">
            {badge && (
              <Badge 
                variant={badge.variant || "default"}
                className="text-xs md:text-xs font-semibold px-1.5 py-0.5"
              >
                {badge.text}
              </Badge>
            )}
            {headerActions}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2 md:space-y-2">
        {/* Information Grid - Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {fields.map((field, index) => (
            <div key={index} className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {field.label}
              </p>
              <div className={`text-xs font-medium text-on-surface ${field.className || ''}`}>
                {field.value}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons - Stack on mobile, row on tablet+ */}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === "outlined" ? "outlined" : action.variant || "filled"}
                size="sm"
                className={`touch-button min-h-[44px] sm:min-h-[36px] text-xs font-medium ${action.className || ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('DataCard action clicked:', action.label);
                  action.onClick();
                }}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}