
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ArrowLeft, Settings, Database, UserCheck, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { authApi } from "@/services/auth";
import { getMockApiConfig } from "@/services/config";
import { secureStorage } from "@/services/secureStorage";
import { sanitizeInput, sanitizeEmail } from "@/utils/inputSanitizer";
import { supabase } from "@/integrations/supabase/client";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("salesperson");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const useMockApi = getMockApiConfig();

  const checkIfAdminCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      // Try to authenticate with Supabase to check if these are admin credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.user) {
        // Valid admin credentials - sign out immediately as we'll handle login through our auth context
        await supabase.auth.signOut();
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email) || sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedEmail || !sanitizedPassword) {
      toast.error("Please provide valid credentials");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First check if these are admin credentials
      const isAdmin = await checkIfAdminCredentials(sanitizedEmail, sanitizedPassword);
      
      if (isAdmin) {
        // Admin login - use the selected role for interface but maintain admin privileges
        toast.success(`Logging in as Owner with ${ROLE_CONFIGS[selectedRole].name} interface`, {
          description: "You have full admin access regardless of interface",
          duration: 3000
        });
        
        // Store the selected role for interface purposes, but mark as admin
        secureStorage.setItem('userRole', 'admin', false);
        secureStorage.setItem('interfaceRole', selectedRole, false);
        secureStorage.setItem('authToken', 'admin-token-' + Date.now(), true);
        secureStorage.setItem('userId', sanitizedEmail, false);
        
        // Use the auth context login for proper session management
        await login(sanitizedEmail, sanitizedPassword);
        return;
      }
      
      if (useMockApi) {
        // Regular employee mock login
        await authApi.login(sanitizedEmail, sanitizedPassword);
        secureStorage.setItem('userRole', selectedRole, false);
        toast.success(`Logged in as ${ROLE_CONFIGS[selectedRole].name}`);
      } else {
        // Use Supabase auth for real authentication
        await login(sanitizedEmail, sanitizedPassword);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const employeeRoles: UserRole[] = ['manager', 'inventory_manager', 'salesperson'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Employee Portal
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Staff Access
              </p>
              {useMockApi && (
                <Badge variant="outline" className="text-blue-600 border-blue-600 mt-2">
                  <Database className="h-3 w-3 mr-1" />
                  Mock Mode
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {useMockApi ? 'Username/Email (any)' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                  placeholder={useMockApi ? "Enter any email" : "Enter your email"}
                  className="h-11 focus-visible:ring-blue-400"
                  maxLength={254}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {useMockApi ? 'Password (any)' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={useMockApi ? "Enter any password" : "Enter your password"}
                    className="h-11 pr-10 focus-visible:ring-blue-400"
                    maxLength={128}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-blue-50"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Interface Role
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {employeeRoles.map((role) => (
                    <Button
                      key={role}
                      type="button"
                      variant={selectedRole === role ? "default" : "outline"}
                      className={`justify-start h-auto p-3 ${
                        selectedRole === role 
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                          : "hover:bg-blue-50"
                      }`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{ROLE_CONFIGS[role].name}</div>
                        <div className="text-xs opacity-75">{ROLE_CONFIGS[role].description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Owners can login with any role interface while maintaining full admin access
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground text-center">
                  {useMockApi 
                    ? "Mock mode is enabled - any credentials will work"
                    : "Only authorized employees and owners can access this portal"
                  }
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="space-y-4">
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              
              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/admin-login" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Dedicated Admin Portal
                </Link>
                <Link 
                  to="/api-settings"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            GOLDEN PHONE Management System
          </p>
        </div>
      </div>
    </div>
  );
}
