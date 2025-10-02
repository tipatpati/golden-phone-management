 import React from "react";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";
  import { Textarea } from "@/components/ui/textarea";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
  from "@/components/ui/select";

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
    value: string | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    options: Array<{ value: string; label: string }>;
  }

  export type FormFieldProps = InputFieldProps | TextareaFieldProps |
  SelectFieldProps;

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
        <Label htmlFor={fieldId} className="text-sm font-medium 
  text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>

        {description && (
          <p className="text-xs text-muted-foreground 
  leading-relaxed">{description}</p>
        )}

        <div className="relative">
          {props.type === "textarea" ? (
            <Textarea
              id={fieldId}
              value={props.value}
              onChange={(e) => props.onChange(e.target.value)}
              placeholder={props.placeholder}
              rows={props.rows || 3}
              className={`
                w-full resize-none transition-colors
                ${error ? "border-destructive focus:border-destructive" :
  "focus:border-primary"}
              `}
            />
          ) : props.type === "select" ? (
            <Select value={props.value || ""} 
  onValueChange={props.onChange}>
              <SelectTrigger 
                id={fieldId} 
                className={`
                  w-full h-10 transition-colors
                  ${error ? "border-destructive focus:border-destructive" : 
  "focus:border-primary"}
                `}
              >
                <SelectValue placeholder={props.placeholder} />
              </SelectTrigger>
              <SelectContent 
                position="popper"
                sideOffset={4}
              >
                {props.options.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="cursor-pointer hover:bg-accent 
  focus:bg-accent"
                  >
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
              onChange={(e) => {
                let value = e.target.value;
                // Auto-sync with units/serial format for serial number
  fields
                if (fieldId.includes('serial') || fieldId.includes('imei')
  || props.placeholder?.includes('serial')) {
                  value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                }
                props.onChange(value);
              }}
              placeholder={props.placeholder}
              className={`
                w-full h-10 transition-colors
                ${error ? "border-destructive focus:border-destructive" :
  "focus:border-primary"}
              `}
            />
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive flex items-center gap-1 
  mt-1">
            <span className="inline-block w-1 h-1 bg-destructive 
  rounded-full"></span>
            {error}
          </p>
        )}
      </div>
    );
  }