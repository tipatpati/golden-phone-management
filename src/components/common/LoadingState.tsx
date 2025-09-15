import React from "react";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { Card } from "@/components/ui/updated-card";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "card" | "fullscreen";
  className?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  size = "md",
  variant = "inline",
  className = "" 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12"
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      <LoadingSpinner />
      <p className="text-muted-foreground mt-2">{message}</p>
    </div>
  );

  if (variant === "card") {
    return (
      <Card className="p-8">
        {content}
      </Card>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}