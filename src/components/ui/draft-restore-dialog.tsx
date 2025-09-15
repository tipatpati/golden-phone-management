import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText } from 'lucide-react';
import { type FormDraft } from '@/services/core/AutoSaveDraftService';

interface DraftRestoreDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  draft: FormDraft | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestoreDialog({
  isOpen,
  onOpenChange,
  draft,
  onRestore,
  onDiscard
}: DraftRestoreDialogProps) {
  if (!draft) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getFormTypeLabel = (formType: string) => {
    switch (formType) {
      case 'acquisition':
        return 'Supplier Acquisition';
      case 'product':
        return 'Product';
      case 'client':
        return 'Client';
      case 'employee':
        return 'Employee';
      default:
        return 'Form';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Draft Found
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                We found a saved draft of your {getFormTypeLabel(draft.formType).toLowerCase()} form. 
                Would you like to restore it or start fresh?
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Last saved: {formatDate(draft.timestamp)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {draft.metadata.completionPercentage}% complete
                  </Badge>
                  {draft.metadata.lastSavedField && (
                    <span className="text-sm text-muted-foreground">
                      Last field: {draft.metadata.lastSavedField}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>
            Restore Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}