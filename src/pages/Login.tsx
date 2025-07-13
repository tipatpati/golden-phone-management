import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ArrowLeft, Settings, Database, UserCheck, Crown, User, Mail, Lock, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { authApi } from "@/services/auth";
import { getMockApiConfig } from "@/services/config";
import { secureStorage } from "@/services/secureStorage";
import { sanitizeInput, sanitizeEmail } from "@/utils/inputSanitizer";
import { supabase } from "@/integrations/supabase/client";
import forestBackground from "@/assets/forest-background.jpg";

type LoginType = 'admin' | 'employee';

export default function Login() {
  const [loginType, setLoginType] = useState<LoginType>('employee');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("salesperson");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const useMockApi = getMockApiConfig();

  const checkIfAdminCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.user) {
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
    
    const sanitizedEmail = sanitizeEmail(email) || sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedEmail || !sanitizedPassword) {
      toast.error("Please provide valid credentials");
      return;
    }

    if (loginType === 'admin' && sanitizedPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (loginType === 'admin') {
        await login(sanitizedEmail, sanitizedPassword);
      } else {
        // Employee login logic
        const isAdmin = await checkIfAdminCredentials(sanitizedEmail, sanitizedPassword);
        
        if (isAdmin) {
          toast.success(`Logging in as Owner with ${ROLE_CONFIGS[selectedRole].name} interface`, {
            description: "You have full admin access regardless of interface",
            duration: 3000
          });
          
          secureStorage.setItem('userRole', 'admin', false);
          secureStorage.setItem('interfaceRole', selectedRole, false);
          secureStorage.setItem('authToken', 'admin-token-' + Date.now(), true);
          secureStorage.setItem('userId', sanitizedEmail, false);
          
          await login(sanitizedEmail, sanitizedPassword);
          return;
        }
        
        if (useMockApi) {
          await authApi.login(sanitizedEmail, sanitizedPassword);
          secureStorage.setItem('userRole', selectedRole, false);
          toast.success(`Logged in as ${ROLE_CONFIGS[selectedRole].name}`);
        } else {
          await login(sanitizedEmail, sanitizedPassword);
        }
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
    <div 
      className="min-h-screen forest-background flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${forestBackground})` }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className="glass-card p-8 space-y-6">
          {/* Toggle Buttons */}
          <div className="flex rounded-full p-1 glass-card">
            <button
              type="button"
              onClick={() => setLoginType('employee')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                loginType === 'employee' 
                  ? 'bg-white/20 text-white shadow-md' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Employee
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                loginType === 'admin' 
                  ? 'bg-white/20 text-white shadow-md' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Crown className="h-4 w-4 inline mr-2" />
              Admin
            </button>
          </div>

          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
            <p className="text-white/80 text-sm">
              {loginType === 'admin' 
                ? 'Sign in to your admin account' 
                : 'Sign in to your employee account'
              }
            </p>
            {loginType === 'employee' && useMockApi && (
              <Badge variant="outline" className="text-green-300 border-green-300/50 bg-green-500/10">
                <Database className="h-3 w-3 mr-1" />
                Mock Mode
              </Badge>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                <Mail className="h-4 w-4 inline mr-2" />
                {useMockApi && loginType === 'employee' ? 'Username/Email (any)' : 'Email Address'}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                placeholder={useMockApi && loginType === 'employee' ? "Enter any email" : "Enter your email"}
                className="glass-input h-12 text-white placeholder:text-white/60"
                maxLength={254}
                required
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                <Lock className="h-4 w-4 inline mr-2" />
                {useMockApi && loginType === 'employee' ? 'Password (any)' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={useMockApi && loginType === 'employee' ? "Enter any password" : "Enter your password"}
                  className="glass-input h-12 pr-12 text-white placeholder:text-white/60"
                  maxLength={128}
                  minLength={loginType === 'admin' ? 6 : undefined}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection for Employee */}
            {loginType === 'employee' && (
              <div className="space-y-2">
                <Label className="text-white/90 text-sm font-medium">
                  Interface Role
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {employeeRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`p-3 rounded-lg text-left transition-all ${
                        selectedRole === role 
                          ? 'bg-white/20 text-white border border-white/30' 
                          : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <div className="font-medium text-sm">{ROLE_CONFIGS[role].name}</div>
                      <div className="text-xs text-white/60">{ROLE_CONFIGS[role].description}</div>
                    </button>
                  ))}
                </div>
                {loginType === 'employee' && (
                  <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-md border border-amber-400/30">
                    <Crown className="h-4 w-4 text-amber-300" />
                    <p className="text-xs text-amber-200">
                      Owners can login with any role interface while maintaining full admin access
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 glass-button font-medium text-white"
              disabled={isLoading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-xs text-white/60">
                {useMockApi && loginType === 'employee'
                  ? "Mock mode is enabled - any credentials will work"
                  : loginType === 'admin' 
                    ? "Only authorized store owners can access admin portal"
                    : "Only authorized employees and owners can access this portal"
                }
              </p>
            </div>
          </form>

          {/* Footer Links */}
          <div className="flex items-center justify-between text-sm pt-4 border-t border-white/10">
            <div className="text-white/60">
              Forgot password?
            </div>
            <Link 
              to="/api-settings"
              className="text-white/60 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-white/60">
            GOLDEN PHONE Management System
          </p>
        </div>
      </div>
    </div>
  );
}