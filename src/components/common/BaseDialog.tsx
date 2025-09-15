import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/updated-dialog";
import { Button } from "@/components/ui/updated-button";
import { Loader2 } from "lucide-react";
import { logger } from "@/utils/logger";

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
      <DialogContent className={`
        ${maxWidthClasses[maxWidth]} 
        w-[95vw] 
        max-h-[90vh] 
        overflow-y-auto 
        p-0
        gap-0
      `}>
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground leading-tight">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 sm:px-6 py-2 flex-1 overflow-y-auto">
          {children}
        </div>

        {showActions && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-muted/30 mt-auto">
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {cancelText}
            </Button>
            {onSubmit && (
              <Button
                onClick={() => {
                  logger.debug('BaseDialog submit button clicked', {}, 'BaseDialog');
                  onSubmit();
                }}
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[120px] order-1 sm:order-2"
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