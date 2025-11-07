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
import { EmployeeFormData, EMPLOYEE_DEPARTMENTS, EMPLOYEE_POSITIONS, EMPLOYEE_STATUS_OPTIONS } from "./types";
import { useStore } from "@/contexts/store/StoreContext";
import { useAuth } from "@/contexts/AuthContext";

interface EmployeeWorkInfoProps {
  formData: EmployeeFormData;
  errors: { [key: string]: string };
  onFieldChange: (field: string, value: string) => void;
  onFieldBlur?: (field: string) => void;
}

export function EmployeeWorkInfo({ 
  formData, 
  errors, 
  onFieldChange, 
  onFieldBlur 
}: EmployeeWorkInfoProps) {
  const { userStores, isSuperAdmin } = useStore();
  const { userRole } = useAuth();
  const canAssignStore = userRole === 'super_admin' || userRole === 'admin';
  
  return (
    <div className="space-y-4">
      {canAssignStore && userStores.length > 0 && (
        <div>
          <Label htmlFor="store_id">Negozio *</Label>
          <Select value={formData.store_id} onValueChange={(value) => onFieldChange("store_id", value)}>
            <SelectTrigger className={errors.store_id ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleziona un negozio" />
            </SelectTrigger>
            <SelectContent>
              {userStores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.store_id && (
            <p className="text-sm text-destructive mt-1">{errors.store_id}</p>
          )}
        </div>
      )}
      <div>
        <Label htmlFor="role">Ruolo *</Label>
        <Select value={formData.role} onValueChange={(value) => onFieldChange("role", value)}>
          <SelectTrigger className={errors.role ? "border-destructive" : ""}>
            <SelectValue placeholder="Seleziona un ruolo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_CONFIGS).map(([roleKey, roleConfig]) => (
              <SelectItem key={roleKey} value={roleKey}>
                {roleConfig.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive mt-1">{errors.role}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">Dipartimento</Label>
          <Select value={formData.department} onValueChange={(value) => onFieldChange("department", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona dipartimento" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYEE_DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="position">Posizione</Label>
          <Select value={formData.position} onValueChange={(value) => onFieldChange("position", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona posizione" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYEE_POSITIONS.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary">Stipendio (€)</Label>
          <Input
            id="salary"
            type="number"
            step="0.01"
            value={formData.salary}
            onChange={(e) => onFieldChange("salary", e.target.value)}
            onBlur={() => onFieldBlur?.("salary")}
            className={errors.salary ? "border-destructive" : ""}
          />
          {errors.salary && (
            <p className="text-sm text-destructive mt-1">{errors.salary}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="hire_date">Data di Assunzione *</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => onFieldChange("hire_date", e.target.value)}
            onBlur={() => onFieldBlur?.("hire_date")}
            className={errors.hire_date ? "border-destructive" : ""}
            required
          />
          {errors.hire_date && (
            <p className="text-sm text-destructive mt-1">{errors.hire_date}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="status">Stato</Label>
        <Select value={formData.status} onValueChange={(value) => onFieldChange("status", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYEE_STATUS_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}