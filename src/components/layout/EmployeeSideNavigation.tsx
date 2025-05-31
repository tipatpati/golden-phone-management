
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutGrid, 
  Users, 
  ShoppingCart,
  PackageSearch, 
  ClipboardList,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutGrid,
    roles: ["manager", "inventory_manager", "salesperson"],
  },
  {
    title: "Sales",
    href: "/sales",
    icon: ShoppingCart,
    roles: ["salesperson", "manager"],
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    roles: ["salesperson", "manager"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: PackageSearch,
    roles: ["manager", "inventory_manager"],
  },
  {
    title: "Repairs",
    href: "/repairs",
    icon: ClipboardList,
    roles: ["manager"],
  },
];

interface EmployeeSideNavigationProps {
  userRole: UserRole;
}

export function EmployeeSideNavigation({ userRole }: EmployeeSideNavigationProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const config = ROLE_CONFIGS[userRole];

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMenu}
          className="fixed top-4 left-4 z-50"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
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
          <div className="flex h-16 items-center justify-center border-b border-border px-4">
            <div className="text-center">
              <h1 className="text-lg font-bold text-primary">RetailPro</h1>
              <Badge variant="secondary" className="text-xs mt-1">
                {config.name}
              </Badge>
            </div>
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
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                    {localStorage.getItem('userId')?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{localStorage.getItem('userId')}</p>
                  <p className="text-xs text-muted-foreground">{config.name}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={logout}
                className="h-8 w-8"
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
