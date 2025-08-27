
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator, calculatePasswordStrength } from '@/components/password/PasswordStrengthIndicator';
import { validateInput } from '@/utils/securityEnhancements';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirm: '' });
  const [isValidSession, setIsValidSession] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{
    currentUrl: string;
    hasCode: boolean;
    hasHashTokens: boolean;
    errorDetails?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Collect debug information
        const currentUrl = window.location.href;
        const codeFromQuery = searchParams.get('code') || new URLSearchParams(window.location.hash.substring(1)).get('code');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        const debug = {
          currentUrl,
          hasCode: !!codeFromQuery,
          hasHashTokens: !!(accessToken && refreshToken)
        };

        // 1) If we already have a session, we're good
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (!isMounted) return;
          setDebugInfo(debug);
          setIsValidSession(true);
          return;
        }

        // 2) PKCE flow: try to exchange ?code=... for a session
        if (codeFromQuery) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(codeFromQuery);
          if (error) {
            const errorDetails = `PKCE Exchange Error: ${error.message} (Code: ${error.code || 'unknown'})`;
            setDebugInfo({ ...debug, errorDetails });
            
            toast({
              title: "Invalid reset link",
              description: `This password reset link is invalid or has expired. Error: ${error.message}`,
              variant: "destructive"
            });
            
            // Don't navigate immediately in case of debug mode
            setTimeout(() => navigate('/'), 5000);
            return;
          }
          if (!isMounted) return;
          setDebugInfo(debug);
          setIsValidSession(true);
          return;
        }

        // 3) Legacy/hash tokens fallback
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          } as any);
          
          if (error) {
            const errorDetails = `Legacy Token Error: ${error.message} (Code: ${error.code || 'unknown'})`;
            setDebugInfo({ ...debug, errorDetails });
            
            toast({
              title: "Invalid reset link",
              description: `Failed to authenticate with legacy tokens. Error: ${error.message}`,
              variant: "destructive"
            });
            
            setTimeout(() => navigate('/'), 5000);
            return;
          }
          
          if (!isMounted) return;
          setDebugInfo(debug);
          setIsValidSession(true);
          return;
        }

        // 4) Nothing worked: invalid link
        const errorDetails = "No valid authentication tokens found in URL";
        setDebugInfo({ ...debug, errorDetails });
        
        toast({
          title: "Invalid reset link",
          description: "This password reset link is invalid or has expired. No authentication tokens found.",
          variant: "destructive"
        });
        
        // Show debug info for 5 seconds before redirecting
        setTimeout(() => navigate('/'), 5000);
      } finally {
        if (isMounted) setCheckingLink(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  const validatePassword = (password: string) => {
    const validation = validateInput.password(password, true);
    const strength = calculatePasswordStrength(password);
    
    if (!validation.valid) {
      return validation.error || 'Invalid password';
    }
    
    if (strength.score < 4) {
      return 'Password is too weak. Please choose a stronger password.';
    }
    
    return '';
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error }));
    
    // Revalidate confirm password if it exists
    if (confirmPassword) {
      setErrors(prev => ({ 
        ...prev, 
        confirm: value !== confirmPassword ? 'Passwords do not match' : ''
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setErrors(prev => ({ 
      ...prev, 
      confirm: value !== password ? 'Passwords do not match' : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const passwordError = validatePassword(password);
    const confirmError = password !== confirmPassword ? 'Passwords do not match' : '';
    
    if (passwordError || confirmError) {
      setErrors({ password: passwordError, confirm: confirmError });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: {
          password_changed_at: new Date().toISOString(),
          password_strength: calculatePasswordStrength(password).score
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Unable to reset password. Please try again.",
          variant: "destructive"
        });
      } else {
        setSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been reset successfully."
        });
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink && !success) {
    return null;
  }

  if (!isValidSession && !success) {
    // Show debug information if available
    if (debugInfo && !checkingLink) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Reset Link Issue</CardTitle>
              <CardDescription>
                There was a problem with your password reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Debug Information:</strong>
                  <div className="mt-2 space-y-1 text-xs font-mono bg-muted p-2 rounded">
                    <div>URL: {debugInfo.currentUrl}</div>
                    <div>Has Code: {debugInfo.hasCode ? 'Yes' : 'No'}</div>
                    <div>Has Hash Tokens: {debugInfo.hasHashTokens ? 'Yes' : 'No'}</div>
                    <div>Current Domain: {window.location.origin}</div>
                    {debugInfo.errorDetails && (
                      <div className="text-destructive mt-2">
                        Error: {debugInfo.errorDetails}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Common Solutions:</strong>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>• Check if the Site URL in Supabase matches: {window.location.origin}</li>
                    <li>• Ensure redirect URLs include: {window.location.origin}/reset-password</li>
                    <li>• Try requesting a new password reset email</li>
                    <li>• Make sure the link hasn't expired (usually 1 hour)</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Button 
                className="w-full" 
                onClick={() => navigate('/')}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null; // Will redirect to home
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Password Reset Complete</CardTitle>
            <CardDescription>
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your password has been reset successfully. You will be redirected to the login page shortly.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/')}
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter a new secure password for your account
          </CardDescription>
          {debugInfo && (
            <Alert className="text-left mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="text-xs">
                  <strong>Session verified via:</strong> {window.location.origin}
                  {debugInfo.hasCode && <span className="text-green-600"> ✓ PKCE Code</span>}
                  {debugInfo.hasHashTokens && <span className="text-blue-600"> ✓ Hash Tokens</span>}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter your new password"
                  className={errors.password ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="Confirm your new password"
                  className={errors.confirm ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirm && (
                <p className="text-sm text-destructive">{errors.confirm}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !!errors.password || !!errors.confirm || !password || !confirmPassword}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
