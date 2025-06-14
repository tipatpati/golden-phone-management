
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";

interface EmployeeFormFieldsProps {
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    salary: string;
    hire_date: string;
    status: string;
    role: UserRole;
    password: string;
  };
  onFieldChange: (field: string, value: string) => void;
  showPassword?: boolean;
}

export function EmployeeFormFields({ formData, onFieldChange, showPassword = true }: EmployeeFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => onFieldChange("first_name", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => onFieldChange("last_name", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          required
        />
      </div>

      {showPassword && (
        <div>
          <Label htmlFor="password">Password (optional)</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => onFieldChange("password", e.target.value)}
            placeholder="Leave blank for auto-generated password"
          />
        </div>
      )}

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => onFieldChange("phone", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role} onValueChange={(value) => onFieldChange("role", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_CONFIGS).map(([roleKey, roleConfig]) => (
              <SelectItem key={roleKey} value={roleKey}>
                {roleConfig.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => onFieldChange("department", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => onFieldChange("position", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary">Salary (€)</Label>
          <Input
            id="salary"
            type="number"
            step="0.01"
            value={formData.salary}
            onChange={(e) => onFieldChange("salary", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="hire_date">Hire Date *</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => onFieldChange("hire_date", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => onFieldChange("status", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
