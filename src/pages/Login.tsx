import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { sanitizeInput, sanitizeEmail } from "@/utils/inputSanitizer";
import { Logo } from "@/components/shared/Logo";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    login
  } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = sanitizeEmail(email) || sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    if (!sanitizedEmail || !sanitizedPassword) {
      toast.error("Inserisci credenziali valide");
      return;
    }

    // Basic password strength check
    if (sanitizedPassword.length < 6) {
      toast.error("La password deve essere di almeno 6 caratteri");
      return;
    }
    setIsLoading(true);
    try {
      // Use the auth context login - it will automatically detect user role from database
      await login(sanitizedEmail, sanitizedPassword);
      toast.success("Accesso effettuato! Reindirizzamento...");
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error('Login failed', {
        description: error.message || 'Controlla le tue credenziali'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full blur-2xl"></div>
      </div>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Login Card */}
        <div className="bg-surface/95 backdrop-blur-xl border border-outline/20 rounded-2xl shadow-2xl p-6 lg:p-8 space-y-6 transition-all duration-300 hover:shadow-3xl hover:bg-surface/98">
          {/* Logo and Welcome Section */}
          <div className="text-center space-y-5">
            <div className="flex justify-center mb-6 transform transition-transform duration-300 hover:scale-105">
              <Logo size={160} className="mx-auto drop-shadow-lg" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Bentornato!</h1>
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                Accedi al Sistema di Gestione GOLDEN PHONE
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-on-surface text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Indirizzo Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(sanitizeInput(e.target.value))} 
                placeholder="Inserisci la tua email" 
                className="h-12 transition-all duration-200 focus:scale-[1.02]" 
                maxLength={254} 
                required 
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-on-surface text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Password
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Inserisci la tua password" 
                  className="h-12 pr-12 transition-all duration-200 focus:scale-[1.02]" 
                  maxLength={128} 
                  minLength={6} 
                  required 
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors duration-200 hover:scale-110" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 mt-6 bg-primary hover:bg-primary-dark text-on-primary font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
              disabled={isLoading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? "Accesso in corso..." : "Accedi"}
            </Button>

            {/* Additional Info */}
            <div className="text-center pt-2">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Inserisci le tue credenziali per accedere al sistema. Il tuo ruolo e i permessi verranno rilevati automaticamente.
              </p>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-on-surface-variant opacity-75">
            Sistema di Gestione GOLDEN PHONE
          </p>
        </div>
      </div>
    </div>;
}