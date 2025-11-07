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
      <DialogContent 
        size={size} 
        className="p-0 gap-0 overflow-hidden flex flex-col h-full sm:h-auto max-h-screen sm:max-h-[90vh]"
      >
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5">
          <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {showActions && (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t bg-muted/30 flex-shrink-0">
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px]"
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
                className="w-full sm:w-auto min-w-[120px] min-h-[44px]"
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