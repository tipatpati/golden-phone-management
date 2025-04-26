
import React from "react";
import { SideNavigation } from "./SideNavigation";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen">
      <SideNavigation />
      
      <div className={`flex-1 transition-all ${isMobile ? "pl-0" : "pl-64"}`}>
        <Header />
        <main className="container px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
