import React from "react";
import {
  Dialog,
  EnhancedDialogContent as DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/enhanced-dialog";
import { Button } from "@/components/ui/enhanced-button";
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
  size?: "sm" | "md" | "lg" | "xl";
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
  size = "md"
}: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size={size} className="p-0 gap-0 custom-scrollbar">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 sm:px-8 py-6 flex-1 overflow-y-auto">
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