import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BaseDialogProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  showActions?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function BaseDialog({
  title,
  children,
  open,
  onClose,
  onSubmit,
  isLoading = false,
  submitText = "Save",
  cancelText = "Cancel",
  showActions = true,
  maxWidth = "md"
}: BaseDialogProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl"
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-on-surface">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>

        {showActions && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            {onSubmit && (
              <Button
                onClick={onSubmit}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitText}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}