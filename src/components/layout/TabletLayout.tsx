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

interface TabletLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export function TabletLayout({ children, userRole }: TabletLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState(false);
  
  // Only show sidebar on desktop
  const shouldShowSidebar = isDesktop;
  const defaultOpen = isDesktop;
  
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        {shouldShowSidebar && <TabletSidebar userRole={userRole} />}
        
        {/* Mobile Navigation Overlay */}
        {isMobile && (
          <SideNavigation 
            isOpen={isMobileMenuOpen} 
            setIsOpen={setIsMobileMenuOpen} 
          />
        )}
        
        {/* Tablet Navigation Overlay */}
        {isTablet && (
          <SideNavigation 
            isOpen={isTabletMenuOpen} 
            setIsOpen={setIsTabletMenuOpen} 
          />
        )}
        
        <SidebarInset className="flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="h-8 w-8"
                >
                  {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
                <Separator orientation="vertical" className="h-4" />
              </>
            )}
            
            {/* Tablet Menu Button */}
            {isTablet && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsTabletMenuOpen(!isTabletMenuOpen)}
                  className="h-8 w-8 md:h-9 md:w-9"
                >
                  {isTabletMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
                <Separator orientation="vertical" className="h-4" />
              </>
            )}
            
            {/* Desktop Sidebar Controls */}
            {shouldShowSidebar && <SidebarTrigger className="h-8 w-8 md:h-9 md:w-9" />}
            {shouldShowSidebar && <Separator orientation="vertical" className="h-4" />}
            <Breadcrumb className="hidden md:flex">
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
          </header>
          
          <div className="flex-1 overflow-auto">
            <main className="container mx-auto max-w-none p-3 md:p-4 lg:p-6 xl:p-8">
              <div className="w-full max-w-none overflow-hidden">
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}