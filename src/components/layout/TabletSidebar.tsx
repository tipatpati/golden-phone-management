import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Wrench, 
  Building2, 
  UserCog,
  LogOut,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { Logo } from "@/components/shared/Logo";

interface TabletSidebarProps {
  userRole: UserRole;
}

export function TabletSidebar({ userRole }: TabletSidebarProps) {
  const location = useLocation();
  const { user, logout, username } = useAuth();
  const { state } = useSidebar();

  // Navigation items with role-based permissions
  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      roles: ["admin", "manager", "inventory_manager", "salesperson", "technician"] as UserRole[],
    },
    {
      title: "Vendite",
      url: "/sales",
      icon: ShoppingBag,
      roles: ["admin", "manager", "salesperson"] as UserRole[],
    },
    {
      title: "Inventario",
      url: "/inventory",
      icon: Package,
      roles: ["admin", "manager", "inventory_manager", "salesperson", "technician"] as UserRole[],
    },
    {
      title: "Clienti",
      url: "/clients",
      icon: Users,
      roles: ["admin", "manager", "salesperson", "technician"] as UserRole[],
    },
    {
      title: "Riparazioni",
      url: "/repairs",
      icon: Wrench,
      roles: ["admin", "manager", "salesperson", "technician"] as UserRole[],
    },
    {
      title: "Fornitori",
      url: "/suppliers",
      icon: Building2,
      roles: ["admin", "manager", "inventory_manager"] as UserRole[],
    },
    {
      title: "Dipendenti",
      url: "/employees",
      icon: UserCog,
      roles: ["admin"] as UserRole[],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  );

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

  return (
    <Sidebar className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8" />
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GOLDEN PHONE
              </span>
              <span className="text-xs text-muted-foreground">
                Sistema di Gestione
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigazione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    size="lg"
                    className="h-12 text-base font-medium"
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-6 w-6" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          {state === "expanded" && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {username || user?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {ROLE_CONFIGS[userRole]?.name}
              </p>
            </div>
          )}
        </div>

        {state === "expanded" && <Separator className="mb-3" />}
        
        <Button
          variant="ghost"
          size="lg"
          onClick={handleLogout}
          className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          {state === "expanded" && <span className="ml-2">Disconnetti</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}