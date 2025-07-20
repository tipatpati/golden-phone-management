
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
        <main className="w-full px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 flex justify-center">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
