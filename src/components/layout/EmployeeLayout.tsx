
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
    <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <EmployeeSideNavigation userRole={userRole} />
      
      <div className={`flex-1 transition-all duration-200 ${isMobile ? "pl-0" : "pl-64"}`}>
        <Header />
        <main className="px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
