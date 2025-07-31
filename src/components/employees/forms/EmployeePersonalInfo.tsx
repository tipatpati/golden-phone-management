import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmployeeFormData } from "./types";

interface EmployeePersonalInfoProps {
  formData: EmployeeFormData;
  errors: { [key: string]: string };
  onFieldChange: (field: string, value: string) => void;
  onFieldBlur?: (field: string) => void;
  showPassword?: boolean;
}

export function EmployeePersonalInfo({ 
  formData, 
  errors, 
  onFieldChange, 
  onFieldBlur,
  showPassword = true 
}: EmployeePersonalInfoProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">Nome *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => onFieldChange("first_name", e.target.value)}
            onBlur={() => onFieldBlur?.("first_name")}
            className={errors.first_name ? "border-destructive" : ""}
            required
          />
          {errors.first_name && (
            <p className="text-sm text-destructive mt-1">{errors.first_name}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="last_name">Cognome *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => onFieldChange("last_name", e.target.value)}
            onBlur={() => onFieldBlur?.("last_name")}
            className={errors.last_name ? "border-destructive" : ""}
            required
          />
          {errors.last_name && (
            <p className="text-sm text-destructive mt-1">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          onBlur={() => onFieldBlur?.("email")}
          className={errors.email ? "border-destructive" : ""}
          required
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      {showPassword && (
        <div>
          <Label htmlFor="password">Password (opzionale)</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => onFieldChange("password", e.target.value)}
            placeholder="Lascia vuoto per password generata automaticamente"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Se non inserisci una password, ne verrà generata una automaticamente
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="phone">Telefono</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => onFieldChange("phone", e.target.value)}
          onBlur={() => onFieldBlur?.("phone")}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p className="text-sm text-destructive mt-1">{errors.phone}</p>
        )}
      </div>
    </div>
  );
}