import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TabletSidebar } from "./TabletSidebar";
import { UserRole } from "@/types/roles";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useIsMobile, useIsTablet, useIsDesktop } from "@/hooks/use-mobile";
import { SideNavigation } from "./SideNavigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface TabletLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export function TabletLayout({ children, userRole }: TabletLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Navigation Overlay for all screen sizes */}
      <SideNavigation 
        isOpen={isMenuOpen} 
        setIsOpen={setIsMenuOpen} 
      />
      
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-50 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-background/98 backdrop-blur-lg supports-[backdrop-filter]:bg-background/85 px-4 sm:px-6 md:px-8 shadow-sm transition-shadow duration-200">
          {/* Menu Button for all screen sizes */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-8 w-8 md:h-9 md:w-9"
            aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb className="hidden md:flex flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-sm">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium">Golden Phone Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Theme Toggle */}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
          
        
        <div className="flex-1 overflow-auto">
          <main className="page-container py-3 sm:py-4 md:py-6">
            <div className="w-full overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}