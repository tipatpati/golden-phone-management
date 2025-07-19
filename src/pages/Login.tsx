import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ArrowLeft, Settings, Database, UserCheck, Mail, Lock, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { getMockApiConfig } from "@/services/config";
import { sanitizeInput, sanitizeEmail } from "@/utils/inputSanitizer";
import { Logo } from "@/components/shared/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const useMockApi = getMockApiConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = sanitizeEmail(email) || sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedEmail || !sanitizedPassword) {
      toast.error("Please provide valid credentials");
      return;
    }

    // Basic password strength check for real auth
    if (!useMockApi && sanitizedPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the auth context login - it will automatically detect user role from database
      await login(sanitizedEmail, sanitizedPassword);
      toast.success("Login successful! Redirecting...");
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      
      <div className="w-full max-w-md space-y-4 sm:space-y-6 relative z-10">
        {/* Back to API Settings Link */}
        <Link 
          to="/api-settings" 
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          API Settings
        </Link>

        {/* Login Card */}
        <div className="glass-card p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Logo and Welcome Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Logo size={160} className="mx-auto" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome Back!</h1>
            <p className="text-white/80 text-xs sm:text-sm">
              Sign in to access GOLDEN PHONE Management System
            </p>
            {useMockApi && (
              <Badge variant="outline" className="text-green-300 border-green-300/50 bg-green-500/10 text-xs">
                <Database className="h-3 w-3 mr-1" />
                Mock Mode
              </Badge>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email Field */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-white/90 text-xs sm:text-sm font-medium">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                {useMockApi ? 'Username/Email (any)' : 'Email Address'}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                placeholder={useMockApi ? "Enter any email" : "Enter your email"}
                className="glass-input h-10 sm:h-12 text-white placeholder:text-white/60 text-sm sm:text-base"
                maxLength={254}
                required
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-white/90 text-xs sm:text-sm font-medium">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                {useMockApi ? 'Password (any)' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={useMockApi ? "Enter any password" : "Enter your password"}
                  className="glass-input h-10 sm:h-12 pr-10 sm:pr-12 text-white placeholder:text-white/60 text-sm sm:text-base"
                  maxLength={128}
                  minLength={useMockApi ? 1 : 6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-10 sm:h-12 glass-button font-medium text-white text-sm sm:text-base"
              disabled={isLoading}
            >
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-white/60 leading-tight">
                {useMockApi
                  ? "Mock mode is enabled - any credentials will work. Your role will be auto-detected after login."
                  : "Enter your credentials to access the system. Your role and permissions will be automatically detected."
                }
              </p>
            </div>
          </form>

          {/* Footer Links */}
          <div className="flex items-center justify-between text-xs sm:text-sm pt-3 sm:pt-4 border-t border-white/10">
            <div className="text-white/60">
              Forgot password?
            </div>
            <Link 
              to="/api-settings"
              className="text-white/60 hover:text-white transition-colors"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-white/60">
            GOLDEN PHONE Management System
          </p>
        </div>
      </div>
    </div>
  );
}