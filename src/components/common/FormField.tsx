import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  description?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: "input";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputType?: "text" | "email" | "tel" | "number" | "password";
}

interface TextareaFieldProps extends BaseFieldProps {
  type: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: "select";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}

export type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

export function FormField({
  label,
  required = false,
  error,
  className = "",
  description,
  ...props
}: FormFieldProps) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className="text-sm font-medium text-on-surface">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {props.type === "textarea" ? (
        <Textarea
          id={fieldId}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows || 3}
          className={error ? "border-destructive" : ""}
        />
      ) : props.type === "select" ? (
        <Select value={props.value} onValueChange={props.onChange}>
          <SelectTrigger id={fieldId} className={error ? "border-destructive" : ""}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={fieldId}
          type={props.inputType || "text"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          className={error ? "border-destructive" : ""}
        />
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}