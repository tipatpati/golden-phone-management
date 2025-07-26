
import React, { useState } from "react";
import { SideNavigation } from "./SideNavigation";
import { Header } from "./Header";
import { PWAStatus } from "@/components/pwa/PWAStatus";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Full-width header bar */}
      <Header isMenuOpen={isSidebarOpen} toggleMenu={toggleSidebar} />
      
      {/* Sidebar and main content container */}
      <div className="flex">
        <SideNavigation isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className={`flex-1 min-w-0 transition-all duration-200 ${isMobile ? "pl-0" : "pl-64"}`}>
          <main className="w-full p-4 sm:p-6 lg:p-8 flex justify-center">  {/* 16dp, 24dp, 32dp */}
            <div className="w-full max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* PWA Status Component */}
      <PWAStatus />
    </div>
  );
}
