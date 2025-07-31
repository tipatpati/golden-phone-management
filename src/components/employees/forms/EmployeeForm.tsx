import React from "react";
import { EmployeePersonalInfo } from "./EmployeePersonalInfo";
import { EmployeeWorkInfo } from "./EmployeeWorkInfo";
import { EmployeeFormData } from "./types";

interface EmployeeFormProps {
  formData: EmployeeFormData;
  errors: { [key: string]: string };
  onFieldChange: (field: string, value: string) => void;
  onFieldBlur?: (field: string) => void;
  showPassword?: boolean;
}

export function EmployeeForm({ 
  formData, 
  errors, 
  onFieldChange, 
  onFieldBlur,
  showPassword = true 
}: EmployeeFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Informazioni Personali</h3>
        <EmployeePersonalInfo
          formData={formData}
          errors={errors}
          onFieldChange={onFieldChange}
          onFieldBlur={onFieldBlur}
          showPassword={showPassword}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Informazioni Lavorative</h3>
        <EmployeeWorkInfo
          formData={formData}
          errors={errors}
          onFieldChange={onFieldChange}
          onFieldBlur={onFieldBlur}
        />
      </div>
    </div>
  );
}