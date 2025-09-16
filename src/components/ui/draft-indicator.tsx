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
    
    if (diffMinutes < 1) return 'ora';
    if (diffMinutes < 60) return `${diffMinutes}m fa`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h fa`;
    
    return date.toLocaleDateString('it-IT');
  };

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      {isAutoSaving && (
        <Badge variant="secondary" className="animate-pulse h-6 px-2 text-xs">
          <Save className="w-2.5 h-2.5 mr-1" />
          Salvataggio...
        </Badge>
      )}
      
      {!isAutoSaving && lastSavedAt && (
        <Badge variant="outline" className="h-6 px-2 text-xs border-muted-foreground/20">
          <Clock className="w-2.5 h-2.5 mr-1" />
          Salvato {formatLastSaved(lastSavedAt)}
        </Badge>
      )}
      
      {isDraftAvailable && !isAutoSaving && (
        <div className="flex items-center gap-1">
          <Badge variant="default" className="h-6 px-2 text-xs bg-accent/80 text-accent-foreground">
            <AlertCircle className="w-2.5 h-2.5 mr-1" />
            Bozza disponibile
          </Badge>
          
          {onRestoreDraft && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRestoreDraft}
              className="h-6 px-2 text-xs"
            >
              Ripristina
            </Button>
          )}
          
          {onClearDraft && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearDraft}
              className="h-6 px-2 text-xs"
            >
              Cancella
            </Button>
          )}
        </div>
      )}
    </div>
  );
}