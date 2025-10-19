/**
 * Standardized Page Header Component
 * Material Design 3 compliant with consistent styling across all modules
 */

import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  className = "" 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "glass-card p-4 sm:p-6 lg:p-8 border-glow",
      className
    )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight gradient-tech-text">
            {title}
          </h1>
          {subtitle && (
            <p className="text-on-surface-variant mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg leading-relaxed font-light">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}