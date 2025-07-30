import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "inline" | "card";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "inline",
  className = ""
}: EmptyStateProps) {
  const content = (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-on-surface mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card>
        {content}
      </Card>
    );
  }

  return content;
}