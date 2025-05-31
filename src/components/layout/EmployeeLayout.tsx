
import React from "react";
import { EmployeeSideNavigation } from "./EmployeeSideNavigation";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserRole } from "@/types/roles";

interface EmployeeLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export function EmployeeLayout({ children, userRole }: EmployeeLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <EmployeeSideNavigation userRole={userRole} />
      
      <div className={`flex-1 min-w-0 transition-all ${isMobile ? "pl-0" : "pl-64"}`}>
        <Header />
        <main className="w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 max-w-full overflow-x-hidden">
          <div className="max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
