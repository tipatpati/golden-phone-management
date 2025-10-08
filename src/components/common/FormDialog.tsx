import React, { useImperativeHandle, forwardRef } from "react";
import { BaseDialog } from "@/components/common/BaseDialog";

export interface FormDialogHandle {
  submit: () => Promise<void>;
}

interface FormDialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  submitText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  onSubmit?: (...args: any[]) => Promise<void>;
}

/**
 * Enhanced dialog wrapper that provides better form integration
 * Allows child components to control submission flow
 */
export const FormDialog = forwardRef<FormDialogHandle, FormDialogProps>(
  ({ title, open, onClose, isLoading, submitText, size, children, onSubmit }, ref) => {
    const handleSubmit = async () => {
      if (onSubmit) {
        await onSubmit();
      }
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (onSubmit) {
          await onSubmit();
        }
      }
    }));

    return (
      <BaseDialog
        title={title}
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitText={submitText}
        size={size}
      >
        {children}
      </BaseDialog>
    );
  }
);

FormDialog.displayName = "FormDialog";