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

interface SideNavigationProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function SideNavigation({ isOpen, setIsOpen }: SideNavigationProps = {}) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { logout, userRole, username } = useAuth();

  const menuIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setMenuOpen = setIsOpen || setInternalIsOpen;

  const filteredNavItems = navItems.filter((item) =>
    userRole && item.permission.includes(userRole)
  );

  return (
    <>

      {/* Mobile overlay */}
      {isMobile && menuIsOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30" 
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside
        className={cn(
          "bg-surface-container fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border transition-transform duration-200 ease-in-out",
          isMobile && !menuIsOpen ? "-translate-x-full" : "translate-x-0"
        )}
        style={{ boxShadow: 'var(--elevation-3)' }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-border px-4">
            <Logo size={112} className="mx-auto max-h-12 max-w-[140px]" />
          </div>

          <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                        isActive
                          ? "bg-primary-container text-on-primary-container shadow-sm"
                          : "text-on-surface hover:bg-primary/5 hover:text-primary"
                      )}
                      onClick={() => isMobile && setMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-xs sm:text-sm font-medium">
                    {username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">{username || 'User'}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{userRole || 'Unknown'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={logout}
                className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-yellow-50 hover:text-yellow-700 flex-shrink-0"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
