
import React from "react";
import { WelcomeScreen } from "@/components/employee/WelcomeScreen";
import { UserRole } from "@/types/roles";

interface EmployeeDashboardProps {
  userRole: UserRole;
}

export function EmployeeDashboard({ userRole }: EmployeeDashboardProps) {
  return <WelcomeScreen userRole={userRole} />;
}

export default EmployeeDashboard;
