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
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-on-surface">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
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