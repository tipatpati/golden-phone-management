
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Package, 
  Wrench, 
  FileText, 
  Settings,
  UserCog
} from "lucide-react";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    label: "Sales",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    label: "Repairs",
    href: "/repairs",
    icon: Wrench,
  },
  {
    label: "Employees",
    href: "/employees",
    icon: UserCog,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function SideNavigation() {
  const location = useLocation();

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
