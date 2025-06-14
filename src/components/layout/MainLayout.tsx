
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
    <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <SideNavigation />
      
      <div className={`flex-1 transition-all duration-200 ${isMobile ? "pl-0" : "pl-64"}`}>
        <Header />
        <main className="px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
