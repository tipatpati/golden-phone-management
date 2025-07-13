import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  Users, 
  ShoppingCart,
  PackageSearch, 
  ClipboardList, 
  BarChart4,
  Settings,
  Menu,
  X,
  LogOut,
  UserCog
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/roles";
import { Logo } from "@/components/shared/Logo";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  permission: UserRole[];
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutGrid,
    permission: ["salesperson", "manager", "inventory_manager", "admin"],
  },
  {
    title: "Vendite",
    href: "/sales",
    icon: ShoppingCart,
    permission: ["salesperson", "manager", "admin"],
  },
  {
    title: "Clienti",
    href: "/clients",
    icon: Users,
    permission: ["salesperson", "manager", "admin"],
  },
  {
    title: "Inventario",
    href: "/inventory",
    icon: PackageSearch,
    permission: ["manager", "inventory_manager", "admin"],
  },
  {
    title: "Fornitori",
    href: "/suppliers",
    icon: Users,
    permission: ["manager", "inventory_manager", "admin"],
  },
  {
    title: "Riparazioni",
    href: "/repairs",
    icon: ClipboardList,
    permission: ["manager", "admin"],
  },
  {
    title: "Report",
    href: "/reports",
    icon: BarChart4,
    permission: ["manager", "admin"],
  },
  {
    title: "Dipendenti",
    href: "/employees",
    icon: UserCog,
    permission: ["admin"],
  },
  {
    title: "Impostazioni",
    href: "/settings",
    icon: Settings,
    permission: ["admin"],
  },
];

export function SideNavigation() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { logout, userRole, username } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const filteredNavItems = navItems.filter((item) =>
    userRole && item.permission.includes(userRole)
  );

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMenu}
          className="fixed top-3 left-3 z-50 hover:bg-yellow-50 hover:text-yellow-700 h-9 w-9"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}

      {/* Sidebar navigation */}
      <aside
        className={cn(
          "bg-sidebar fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border transition-transform duration-200 ease-in-out",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-border">
            <Logo size={128} className="mx-auto max-h-12 max-w-[140px]" />
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 hover:text-yellow-800"
                      )}
                      onClick={() => isMobile && setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">
                    {username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{username || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{userRole || 'Unknown'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={logout}
                className="h-8 w-8 hover:bg-yellow-50 hover:text-yellow-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
