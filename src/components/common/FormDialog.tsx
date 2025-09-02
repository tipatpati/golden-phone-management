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
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
  onSubmit?: () => Promise<void>;
}

/**
 * Enhanced dialog wrapper that provides better form integration
 * Allows child components to control submission flow
 */
export const FormDialog = forwardRef<FormDialogHandle, FormDialogProps>(
  ({ title, open, onClose, isLoading, submitText, maxWidth, children, onSubmit }, ref) => {
    const [submitHandler, setSubmitHandler] = React.useState<(() => Promise<void>) | null>(null);

    // Allow child components to register their submit handlers
    React.useEffect(() => {
      console.log('🔄 FormDialog checking for submit handler');
      const handler = (window as any).__currentFormSubmit;
      console.log('🔄 Found handler:', !!handler, typeof handler);
      if (handler && typeof handler === 'function') {
        console.log('🔄 Setting submit handler');
        setSubmitHandler(() => handler);
      }
    }, [open]); // Only re-check when dialog opens

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (submitHandler) {
          await submitHandler();
        } else if (onSubmit) {
          await onSubmit();
        }
      }
    }));

    const handleSubmit = async () => {
      console.log('🔄 FormDialog handleSubmit called, submitHandler:', !!submitHandler, 'onSubmit:', !!onSubmit);
      if (submitHandler) {
        console.log('🔄 Calling submitHandler from FormDialog');
        await submitHandler();
      } else if (onSubmit) {
        console.log('🔄 Calling onSubmit from FormDialog');
        await onSubmit();
      } else {
        console.log('❌ No submit handler found in FormDialog');
      }
    };

    return (
      <BaseDialog
        title={title}
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitText={submitText}
        maxWidth={maxWidth}
      >
        {children}
      </BaseDialog>
    );
  }
);

FormDialog.displayName = "FormDialog";