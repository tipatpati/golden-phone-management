/**
 * Standardized Page Layout Container
 * Ensures consistent spacing, background, and structure across all modules
 */

import React from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      "p-3 sm:p-4 lg:p-6",
      className
    )}>
      {/* Neon gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-surface via-surface-container-low to-surface-bright -z-10" />
      <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-tertiary/5 -z-10" />
      
      {/* Neon glow orbs */}
      <div className="fixed top-0 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="fixed bottom-0 -right-1/4 w-1/2 h-1/2 bg-tertiary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '10s' }} />
      
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-0">
        {children}
      </div>
    </div>
  );
}
