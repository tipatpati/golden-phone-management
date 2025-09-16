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
import { FileText } from 'lucide-react';

interface SimpleDraftDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: () => void;
  onDiscard: () => void;
  formType?: string;
}

export function SimpleDraftDialog({
  isOpen,
  onOpenChange,
  onRestore,
  onDiscard,
  formType = 'form'
}: SimpleDraftDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Continue Previous Draft?
          </AlertDialogTitle>
          <AlertDialogDescription>
            We found a saved draft of your {formType}. Would you like to continue where you left off or start fresh?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>
            Continue Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}