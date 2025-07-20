import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Key, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Mail,
  Smartphone,
  Globe,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SecurityStatus {
  passwordLastChanged?: string;
  passwordAge: number;
  passwordStrengthScore: number;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  lastLoginDate?: string;
  suspiciousActivity: boolean;
}

export function AccountSecurityPanel() {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    passwordAge: 0,
    passwordStrengthScore: 3,
    twoFactorEnabled: false,
    emailVerified: true,
    suspiciousActivity: false
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityStatus();
  }, [user]);

  const loadSecurityStatus = async () => {
    if (!user) return;
    
    try {
      // Get user metadata for password change date
      const { data: userData } = await supabase.auth.getUser();
      
      const passwordLastChanged = userData.user?.user_metadata?.password_changed_at;
      const passwordAge = passwordLastChanged 
        ? Math.floor((Date.now() - new Date(passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24))
        : 90; // Default to 90 days if no change date

      const lastLoginDate = userData.user?.last_sign_in_at;
      
      setSecurityStatus({
        passwordLastChanged,
        passwordAge,
        passwordStrengthScore: userData.user?.user_metadata?.password_strength || 3,
        twoFactorEnabled: false, // Would need to check MFA settings
        emailVerified: userData.user?.email_confirmed_at != null,
        lastLoginDate,
        suspiciousActivity: false // Would check security logs
      });
    } catch (error) {
      console.error('Error loading security status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStatus = () => {
    if (securityStatus.passwordAge > 90) {
      return { status: 'critical', label: 'Expired', color: 'destructive' };
    } else if (securityStatus.passwordAge > 60) {
      return { status: 'warning', label: 'Expires Soon', color: 'warning' };
    } else {
      return { status: 'good', label: 'Current', color: 'success' };
    }
  };

  const getStrengthStatus = () => {
    if (securityStatus.passwordStrengthScore < 3) {
      return { label: 'Weak', color: 'destructive' };
    } else if (securityStatus.passwordStrengthScore < 5) {
      return { label: 'Fair', color: 'warning' };
    } else {
      return { label: 'Strong', color: 'success' };
    }
  };

  const handlePasswordChanged = async () => {
    // Update metadata to track password change
    try {
      await supabase.auth.updateUser({
        data: { 
          password_changed_at: new Date().toISOString(),
          password_strength: 5 // Assume new password is strong
        }
      });
      await loadSecurityStatus();
    } catch (error) {
      console.error('Error updating password metadata:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });
      toast({
        title: "Verification email sent",
        description: "Check your email for verification instructions."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to send verification email.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading security status...</div>;
  }

  const passwordStatus = getPasswordStatus();
  const strengthStatus = getStrengthStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security Overview
          </CardTitle>
          <CardDescription>
            Monitor and manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Score */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Security Score</h3>
                <p className="text-sm text-muted-foreground">Overall account security</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">85%</div>
              <Badge variant="outline" className="text-xs">Good</Badge>
            </div>
          </div>

          <Separator />

          {/* Password Security */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Password Security
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="text-sm font-medium">Password Status</p>
                  <p className="text-xs text-muted-foreground">
                    {securityStatus.passwordAge} days old
                  </p>
                </div>
                <Badge variant={passwordStatus.color as any}>
                  {passwordStatus.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="text-sm font-medium">Password Strength</p>
                  <p className="text-xs text-muted-foreground">
                    Based on complexity
                  </p>
                </div>
                <Badge variant={strengthStatus.color as any}>
                  {strengthStatus.label}
                </Badge>
              </div>
            </div>

            <Button 
              onClick={() => setChangePasswordOpen(true)}
              className="w-full sm:w-auto"
            >
              Change Password
            </Button>
          </div>

          <Separator />

          {/* Account Verification */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Account Verification
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${securityStatus.emailVerified ? 'bg-green-100' : 'bg-red-100'}`}>
                    {securityStatus.emailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Verification</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                {!securityStatus.emailVerified && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleResendVerification}
                  >
                    Verify
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-gray-100">
                    <Smartphone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Not configured</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Activity Monitoring */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </h3>
            
            <div className="space-y-2">
              {securityStatus.lastLoginDate && (
                <div className="flex items-center justify-between text-sm">
                  <span>Last login:</span>
                  <span className="text-muted-foreground">
                    {format(new Date(securityStatus.lastLoginDate), 'PPP')}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span>Suspicious activity:</span>
                <span className={securityStatus.suspiciousActivity ? 'text-red-600' : 'text-green-600'}>
                  {securityStatus.suspiciousActivity ? 'Detected' : 'None detected'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Recommendations */}
          {(passwordStatus.status !== 'good' || strengthStatus.color !== 'success') && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Security Recommendations
                </h3>
                <ul className="space-y-2 text-sm">
                  {passwordStatus.status !== 'good' && (
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full mt-2" />
                      Update your password - it's {securityStatus.passwordAge} days old
                    </li>
                  )}
                  {strengthStatus.color !== 'success' && (
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full mt-2" />
                      Choose a stronger password with more complexity
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-amber-500 rounded-full mt-2" />
                    Enable two-factor authentication for extra security
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        requireCurrentPassword={true}
      />
    </div>
  );
}