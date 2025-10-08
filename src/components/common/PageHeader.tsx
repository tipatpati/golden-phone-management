/**
 * Standardized Page Header Component
 * Material Design 3 compliant with consistent styling across all modules
 */

import React from "react";

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
    <div className={`bg-surface-container-highest rounded-xl sm:rounded-2xl md-elevation-1 p-4 sm:p-6 lg:p-8 border-0 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-variant bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-on-surface-variant mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg leading-relaxed">
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