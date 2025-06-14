
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ArrowLeft, Settings, Database, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { authApi } from "@/services/auth";
import { getMockApiConfig } from "@/services/config";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("salesperson");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const useMockApi = getMockApiConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (useMockApi) {
        // Use the Django/mock auth service for employees
        await authApi.login(email, password);
        localStorage.setItem('userRole', selectedRole);
      } else {
        // Use Supabase auth for real authentication
        await login(email, password);
      }
    } catch (error) {
      // Error is already shown by the auth service
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={useMockApi ? "Enter any email" : "Enter your email"}
                  className="h-11 focus-visible:ring-blue-400"
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
                  Your Role
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
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground text-center">
                  {useMockApi 
                    ? "Mock mode is enabled - any credentials will work"
                    : "Only authorized employees can access this portal"
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
                {isLoading ? "Signing In..." : "Sign In as Employee"}
              </Button>
              
              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/admin-login" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Store Owner? Sign in here
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
