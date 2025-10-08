/**
 * Standardized Empty State Component
 * Material Design 3 compliant with consistent styling
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/updated-card";
import { Button } from "@/components/ui/updated-button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)} variant="outlined">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="rounded-full bg-surface-container-highest p-6 mb-6">
          <Icon className="h-12 w-12 text-on-surface-variant" />
        </div>
        <h3 className="text-xl font-semibold text-on-surface mb-2">
          {title}
        </h3>
        <p className="text-on-surface-variant mb-6 max-w-md">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="filled">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
