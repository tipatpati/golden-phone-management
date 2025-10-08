/**
 * Standardized Stats Card Component
 * Material Design 3 compliant with consistent styling and optional interactivity
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/updated-card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient?: string;
  interactive?: boolean;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  gradient = "from-primary/10 to-primary-variant/10",
  interactive = false,
  onClick,
  isActive = false,
  className,
}: StatsCardProps) {
  return (
    <Card
      variant={interactive ? "elevated" : "filled"}
      interactive={interactive}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        interactive && "cursor-pointer hover:scale-[1.02]",
        isActive && "ring-2 ring-primary ring-offset-2",
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity",
        gradient,
        interactive && "group-hover:opacity-70"
      )} />
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-on-surface-variant mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-on-surface tracking-tight">
              {value}
            </p>
            {description && (
              <p className="text-xs text-on-surface-variant mt-2">
                {description}
              </p>
            )}
            {trend && (
              <p className={cn(
                "text-sm font-medium mt-2",
                trend.isPositive ? "text-green-600 dark:text-green-400" : "text-destructive"
              )}>
                {trend.value}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-surface-container-highest/50 transition-transform",
            interactive && "group-hover:scale-110"
          )}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
