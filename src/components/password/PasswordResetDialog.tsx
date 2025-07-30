import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BaseDialog, FormField } from '@/components/common';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { validateInput } from '@/utils/securityEnhancements';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordResetDialog({ open, onOpenChange }: PasswordResetDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const validation = validateInput.email(value);
    setEmailError(validation.valid ? '' : validation.error || '');
  };

  const handleSubmit = async () => {
    const validation = validateInput.email(email);
    if (!validation.valid) {
      setEmailError(validation.error || 'Invalid email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        toast({
          title: "Error",
          description: "Unable to send reset email. Please try again.",
          variant: "destructive"
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Email sent",
          description: "Check your email for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setEmailError('');
    onOpenChange(false);
  };

  return (
    <BaseDialog
      title={emailSent ? "Email Sent" : "Reset Password"}
      open={open}
      onClose={handleClose}
      onSubmit={emailSent ? undefined : handleSubmit}
      isLoading={loading}
      submitText="Send Reset Email"
      showActions={!emailSent}
    >
      {emailSent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              We've sent password reset instructions to:
            </p>
            <p className="font-medium">{email}</p>
          </div>
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Check your email inbox and follow the instructions to reset your password. 
              The link will expire in 1 hour for security reasons.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
          
          <FormField
            label="Email Address"
            inputType="email"
            value={email}
            onChange={handleEmailChange}
            error={emailError}
            placeholder="Enter your email address"
            required
          />
        </div>
      )}
    </BaseDialog>
  );
}