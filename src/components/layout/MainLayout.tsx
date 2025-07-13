
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
    <div className="flex min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <SideNavigation />
      
      <div className={`flex-1 min-w-0 transition-all duration-200 ${isMobile ? "pl-0" : "pl-64"}`}>
        <Header />
        <main className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-full overflow-x-hidden">
          <div className="max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
