
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { authApi } from "@/services/auth";
import { toast } from "@/components/ui/sonner";

interface EmployeeLoginProps {
  role: UserRole;
  onBack: () => void;
  onLoginSuccess: (role: UserRole) => void;
  onLoginError?: () => void;
}

export function EmployeeLogin({ role, onBack, onLoginSuccess, onLoginError }: EmployeeLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const config = ROLE_CONFIGS[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    console.log('EmployeeLogin: Attempting login for role:', role);
    setIsLoading(true);
    
    try {
      const result = await authApi.login(username, password);
      console.log('EmployeeLogin: Login successful:', result);
      
      // Store the selected role (this should ideally be validated by your Django backend)
      localStorage.setItem('userRole', role);
      onLoginSuccess(role);
    } catch (error) {
      console.error('EmployeeLogin: Login failed:', error);
      if (onLoginError) {
        onLoginError();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="absolute top-4 left-4 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="mt-4">
            <Badge variant="secondary" className="mb-2">
              {config.name}
            </Badge>
            <CardTitle className="text-xl">Employee Access</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Login with your Django backend credentials for {config.name.toLowerCase()} access
            </p>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Django Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your Django username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Django password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Connecting to Django..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
