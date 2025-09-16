import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Clock } from 'lucide-react';

interface SimpleDraftButtonProps {
  hasDraft: boolean;
  isAutoSaving?: boolean;
  onRestore: () => void;
  onClear?: () => void;
  className?: string;
}

export function SimpleDraftButton({
  hasDraft,
  isAutoSaving = false,
  onRestore,
  onClear,
  className
}: SimpleDraftButtonProps) {
  if (!hasDraft && !isAutoSaving) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isAutoSaving && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 animate-spin" />
          Saving...
        </div>
      )}
      
      {hasDraft && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRestore}
          className="flex items-center gap-2 text-primary"
        >
          <FileText className="w-4 h-4" />
          Restore Draft
        </Button>
      )}
    </div>
  );
}