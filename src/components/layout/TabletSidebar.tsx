import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, Users, Wrench, Building2, UserCog, LogOut, User, Undo2 } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { Logo } from "@/components/shared/Logo";
interface TabletSidebarProps {
  userRole: UserRole;
}
export function TabletSidebar({
  userRole
}: TabletSidebarProps) {
  const location = useLocation();
  const {
    user,
    logout,
    username
  } = useAuth();
  const {
    state
  } = useSidebar();

  // Navigation items with role-based permissions
  const navItems = [{
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "manager", "inventory_manager", "salesperson", "technician"] as UserRole[]
  }, {
    title: "Vendite",
    url: "/sales",
    icon: ShoppingBag,
    roles: ["super_admin", "admin", "manager", "salesperson"] as UserRole[]
  }, {
    title: "Resi",
    url: "/returns",
    icon: Undo2,
    roles: ["super_admin", "admin", "manager", "salesperson"] as UserRole[]
  }, {
    title: "Inventario",
    url: "/inventory",
    icon: Package,
    roles: ["super_admin", "admin", "manager", "inventory_manager", "salesperson", "technician"] as UserRole[]
  }, {
    title: "Clienti",
    url: "/clients",
    icon: Users,
    roles: ["super_admin", "admin", "manager", "salesperson", "technician"] as UserRole[]
  }, {
    title: "Riparazioni",
    url: "/repairs",
    icon: Wrench,
    roles: ["super_admin", "admin", "manager", "salesperson", "technician"] as UserRole[]
  }, {
    title: "Fornitori",
    url: "/suppliers",
    icon: Building2,
    roles: ["super_admin", "admin", "manager", "inventory_manager"] as UserRole[]
  }, {
    title: "Dipendenti",
    url: "/employees",
    icon: UserCog,
    roles: ["super_admin", "admin"] as UserRole[]
  }];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };
  const getUserInitials = () => {
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return <Sidebar collapsible="icon" className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="border-b p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Logo className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0" />
          {state === "expanded"}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 md:px-3">
        <SidebarGroup>
          {state === "expanded" && <SidebarGroupLabel className="px-2 py-2 text-xs font-medium">
              Navigazione
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredNavItems.map(item => <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="h-11 md:h-12 px-3 text-sm md:text-base font-medium rounded-lg transition-all duration-200 hover:bg-accent/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground touch-target" tooltip={state === "collapsed" ? item.title : undefined}>
                    <NavLink to={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                      {state === "expanded" && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3 mb-3">
          <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          {state === "expanded" && <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {username || user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {ROLE_CONFIGS[userRole]?.name}
              </p>
            </div>}
        </div>

        {state === "expanded" && <Separator className="mb-3" />}
        
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start h-10 md:h-11 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-colors touch-target">
          <LogOut className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          {state === "expanded" && <span className="ml-2 text-sm">Disconnetti</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>;
}