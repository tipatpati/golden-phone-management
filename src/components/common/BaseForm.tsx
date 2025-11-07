import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/updated-card";
import { Button } from "@/components/ui/updated-button";
import { Loader2 } from "lucide-react";

interface BaseFormProps {
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  className?: string;
}

export function BaseForm({
  title,
  children,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = "Save",
  cancelText = "Cancel",
  className = ""
}: BaseFormProps) {
  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
        <CardTitle className="text-lg sm:text-xl font-semibold text-on-surface">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
          {children}
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t">
            <Button
              type="button"
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto min-w-[100px] min-h-[44px]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}