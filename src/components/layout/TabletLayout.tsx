import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TabletSidebar } from "./TabletSidebar";
import { UserRole } from "@/types/roles";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useIsMobile } from "@/hooks/use-mobile";

interface TabletLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export function TabletLayout({ children, userRole }: TabletLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <TabletSidebar userRole={userRole} />
        <SidebarInset className="flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4">
            <SidebarTrigger className="h-8 w-8 md:h-9 md:w-9" />
            <Separator orientation="vertical" className="h-4" />
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