import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { LogIn, Eye, EyeOff, UserPlus, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { sanitizeInput, sanitizeEmail } from "@/utils/inputSanitizer";
import { enhancedRateLimiter, validateInput, handleSecurityError, monitorSecurityEvents } from "@/utils/securityEnhancements";
import { PasswordStrengthIndicator } from "@/components/password/PasswordStrengthIndicator";
import { PasswordResetDialog } from "@/components/password/PasswordResetDialog";

interface SecureLoginFormProps {
  onLoginSuccess: () => void;
}

export function SecureLoginForm({ onLoginSuccess }: SecureLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("salesperson");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  
  const { login, signup } = useAuth();

  // Real-time input validation
  const validateEmailInput = useCallback((value: string) => {
    const validation = validateInput.email(value);
    setEmailError(validation.valid ? "" : validation.error || "");
    return validation.valid;
  }, []);

  const validatePasswordInput = useCallback((value: string, isSignup = false) => {
    const validation = validateInput.password(value, isSignup);
    setPasswordError(validation.valid ? "" : validation.error || "");
    return validation.valid;
  }, []);

  const validateUsernameInput = useCallback((value: string) => {
    const validation = validateInput.username(value);
    setUsernameError(validation.valid ? "" : validation.error || "");
    return validation.valid;
  }, []);

  // Handle rate limiting countdown
  React.useEffect(() => {
    if (retryAfter > 0) {
      setRateLimited(true);
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev <= 1) {
            setRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleEmailChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    setEmail(sanitized);
    validateEmailInput(sanitized);
    
    // Monitor for suspicious input
    monitorSecurityEvents.trackSuspiciousInput(value, 'email');
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePasswordInput(value, activeTab === 'signup');
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    setUsername(sanitized);
    validateUsernameInput(sanitized);
    
    // Monitor for suspicious input
    monitorSecurityEvents.trackSuspiciousInput(value, 'username');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const rateCheck = await enhancedRateLimiter.checkAuth(email);
    if (!rateCheck.allowed) {
      setRetryAfter(rateCheck.retryAfter || 60);
      toast.error(`Too many attempts. Please wait ${Math.ceil((rateCheck.retryAfter || 0) / 1000)} seconds.`);
      return;
    }
    
    // Validate all inputs
    const emailValid = validateEmailInput(email);
    const passwordValid = validatePasswordInput(password);
    
    if (!emailValid || !passwordValid) {
      toast.error("Please fix the errors below and try again");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (error) {
      // Record failed attempt for rate limiting
      const failureCheck = await enhancedRateLimiter.recordFailedAuth(email);
      if (!failureCheck.allowed) {
        setRetryAfter(failureCheck.retryAfter || 60);
      }
      
      // Monitor failed login
      await monitorSecurityEvents.trackFailedLogin(email, error instanceof Error ? error.message : 'Unknown error');
      
      handleSecurityError(error, 'login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const rateCheck = await enhancedRateLimiter.checkAuth(email);
    if (!rateCheck.allowed) {
      setRetryAfter(rateCheck.retryAfter || 60);
      toast.error(`Too many attempts. Please wait ${Math.ceil((rateCheck.retryAfter || 0) / 1000)} seconds.`);
      return;
    }
    
    // Validate all inputs
    const emailValid = validateEmailInput(email);
    const passwordValid = validatePasswordInput(password, true);
    const usernameValid = validateUsernameInput(username);
    
    if (!emailValid || !passwordValid || !usernameValid) {
      toast.error("Please fix the errors below and try again");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(email, password, username, selectedRole);
      setActiveTab("login");
      setPassword(""); // Clear password for security
      toast.success("Account created successfully! Please log in.");
    } catch (error) {
      handleSecurityError(error, 'signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            GOLDEN PHONE
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Secure access to your management system
          </p>
        </CardHeader>
        
        {rateLimited && (
          <div className="mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Too many attempts. Please wait {retryAfter} seconds.
              </span>
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mx-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email"
                    maxLength={254}
                    required
                    disabled={rateLimited}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Enter your password"
                      maxLength={128}
                      required
                      disabled={rateLimited}
                      className={passwordError ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={rateLimited}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                   )}
                 </div>

                 <div className="flex justify-end">
                   <Button
                     type="button"
                     variant="link"
                     className="text-sm p-0 h-auto"
                     onClick={() => setPasswordResetOpen(true)}
                   >
                     Forgot your password?
                   </Button>
                 </div>
               </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || rateLimited || !!emailError || !!passwordError}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username (Optional)</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Enter a username"
                    maxLength={50}
                    disabled={rateLimited}
                    className={usernameError ? "border-destructive" : ""}
                  />
                  {usernameError && (
                    <p className="text-sm text-destructive">{usernameError}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email"
                    maxLength={254}
                    required
                    disabled={rateLimited}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Create a password (min 6 characters)"
                      maxLength={128}
                      minLength={6}
                      required
                      disabled={rateLimited}
                      className={passwordError ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={rateLimited}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                   {passwordError && (
                     <p className="text-sm text-destructive">{passwordError}</p>
                   )}
                   <PasswordStrengthIndicator password={password} />
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="role-select">Role</Label>
                  <Select 
                    value={selectedRole} 
                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                    disabled={rateLimited}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_CONFIGS[selectedRole].description}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || rateLimited || !!emailError || !!passwordError || !!usernameError}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <PasswordResetDialog
        open={passwordResetOpen}
        onOpenChange={setPasswordResetOpen}
      />
    </div>
  );
}