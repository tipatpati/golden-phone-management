import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';
import { AlertTriangle, Shield } from 'lucide-react';

interface RoleChangeConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentRole: UserRole;
  newRole: UserRole;
  targetUserId: string;
  isOwnRole: boolean;
}

export function RoleChangeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  currentRole,
  newRole,
  targetUserId,
  isOwnRole
}: RoleChangeConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [reasoning, setReasoning] = useState('');
  
  const requiredConfirmation = `CHANGE ROLE TO ${newRole.toUpperCase()}`;
  const isConfirmed = confirmationText === requiredConfirmation;
  
  const handleConfirm = () => {
    if (isConfirmed && reasoning.trim().length >= 10) {
      onConfirm();
      setConfirmationText('');
      setReasoning('');
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setReasoning('');
    onClose();
  };

  const isHighRiskChange = ((currentRole === 'admin' || currentRole === 'super_admin') && newRole !== 'admin' && newRole !== 'super_admin') || 
                          (currentRole !== 'admin' && currentRole !== 'super_admin' && (newRole === 'admin' || newRole === 'super_admin'));

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Confirm Role Change
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {isOwnRole && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Security Warning</span>
                </div>
                <p className="text-sm mt-1 text-destructive">
                  You are changing your own role. This action cannot be undone by yourself.
                </p>
              </div>
            )}
            
            {isHighRiskChange && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">High Risk Change</span>
                </div>
                <p className="text-sm mt-1 text-orange-600">
                  This change involves administrative privileges and will be permanently logged.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p><strong>Current Role:</strong> {ROLE_CONFIGS[currentRole].name}</p>
              <p><strong>New Role:</strong> {ROLE_CONFIGS[newRole].name}</p>
              <p><strong>User ID:</strong> {targetUserId.slice(0, 8)}...</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="reasoning">Reason for change (minimum 10 characters)</Label>
                <Input
                  id="reasoning"
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Explain why this role change is necessary..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmation">
                  Type "{requiredConfirmation}" to confirm
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type the confirmation text..."
                  className="mt-1 font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed || reasoning.trim().length < 10}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Confirm Role Change
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}