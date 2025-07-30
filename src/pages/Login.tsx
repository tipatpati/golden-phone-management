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
  return <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      
      <div className="w-full max-w-md space-y-4 sm:space-y-6 relative z-10">
        {/* Login Card */}
        <div className="glass-card p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Logo and Welcome Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Logo size={160} className="mx-auto" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Bentornato!</h1>
            <p className="text-white/80 text-xs sm:text-sm">
              Accedi al Sistema di Gestione GOLDEN PHONE
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email Field */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-white/90 text-xs sm:text-sm font-medium">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Indirizzo Email
              </Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(sanitizeInput(e.target.value))} placeholder="Inserisci la tua email" className="glass-input h-10 sm:h-12 text-white placeholder:text-white/60 text-sm sm:text-base" maxLength={254} required />
            </div>
            
            {/* Password Field */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-white/90 text-xs sm:text-sm font-medium">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Password
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Inserisci la tua password" className="glass-input h-10 sm:h-12 pr-10 sm:pr-12 text-white placeholder:text-white/60 text-sm sm:text-base" maxLength={128} minLength={6} required />
                <button type="button" className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full h-10 sm:h-12 glass-button font-medium text-white text-sm sm:text-base" disabled={isLoading}>
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {isLoading ? "Accesso in corso..." : "Accedi"}
            </Button>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-white/60 leading-tight">
                Inserisci le tue credenziali per accedere al sistema. Il tuo ruolo e i permessi verranno rilevati automaticamente.
              </p>
            </div>
          </form>

          {/* Footer Links */}
          <div className="flex items-center justify-center text-xs sm:text-sm pt-3 sm:pt-4 border-t border-white/10">
            
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-white/60">
            Sistema di Gestione GOLDEN PHONE
          </p>
        </div>
      </div>
    </div>;
}