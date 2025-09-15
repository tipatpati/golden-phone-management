import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraftIndicatorProps {
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  isDraftAvailable: boolean;
  onRestoreDraft?: () => void;
  onClearDraft?: () => void;
  className?: string;
}

export function DraftIndicator({
  isAutoSaving,
  lastSavedAt,
  isDraftAvailable,
  onRestoreDraft,
  onClearDraft,
  className
}: DraftIndicatorProps) {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isAutoSaving && (
        <Badge variant="secondary" className="animate-pulse">
          <Save className="w-3 h-3 mr-1" />
          Saving...
        </Badge>
      )}
      
      {!isAutoSaving && lastSavedAt && (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Saved {formatLastSaved(lastSavedAt)}
        </Badge>
      )}
      
      {isDraftAvailable && !isAutoSaving && (
        <div className="flex items-center gap-1">
          <Badge variant="default">
            <AlertCircle className="w-3 h-3 mr-1" />
            Draft available
          </Badge>
          
          {onRestoreDraft && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRestoreDraft}
            >
              Restore
            </Button>
          )}
          
          {onClearDraft && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearDraft}
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}