
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { LogIn, Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { validation } from "@/utils/validation";
import { log } from "@/utils/logger";
import { enhancedRateLimiter } from "@/utils/securityEnhancements";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("salesperson");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const { login, signup } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const rateLimitCheck = enhancedRateLimiter.checkAuth(email);
    if (!rateLimitCheck.allowed) {
      toast.error("Too many attempts", {
        description: `Please wait ${rateLimitCheck.retryAfter} seconds before trying again`
      });
      return;
    }
    
    // Validate inputs using centralized validation
    const emailValidation = validation.email(email);
    const passwordValidation = validation.password(password);
    
    if (!emailValidation.isValid) {
      toast.error("Invalid email", { description: emailValidation.error });
      return;
    }
    
    if (!passwordValidation.isValid) {
      toast.error("Invalid password", { description: passwordValidation.error });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(emailValidation.sanitizedValue, passwordValidation.sanitizedValue);
      log.info('User login from basic form', { email: emailValidation.sanitizedValue }, 'LoginForm');
      onLoginSuccess();
    } catch (error) {
      // Record failed attempt
      enhancedRateLimiter.recordFailedAuth(email);
      // Error is already shown by the auth service
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const rateLimitCheck = enhancedRateLimiter.checkAuth(email);
    if (!rateLimitCheck.allowed) {
      toast.error("Too many attempts", {
        description: `Please wait ${rateLimitCheck.retryAfter} seconds before trying again`
      });
      return;
    }
    
    // Validate inputs using centralized validation
    const emailValidation = validation.email(email);
    const passwordValidation = validation.password(password, { isSignup: true });
    const usernameValidation = validation.username(username);
    
    if (!emailValidation.isValid) {
      toast.error("Invalid email", { description: emailValidation.error });
      return;
    }
    
    if (!passwordValidation.isValid) {
      toast.error("Invalid password", { description: passwordValidation.error });
      return;
    }
    
    if (!usernameValidation.isValid) {
      toast.error("Invalid username", { description: usernameValidation.error });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(
        emailValidation.sanitizedValue, 
        passwordValidation.sanitizedValue, 
        usernameValidation.sanitizedValue, 
        selectedRole
      );
      log.info('User signup from basic form', { email: emailValidation.sanitizedValue, role: selectedRole }, 'LoginForm');
      // After successful signup, switch to login tab
      setActiveTab("login");
      setPassword(""); // Clear password for security
    } catch (error) {
      // Record failed attempt
      enhancedRateLimiter.recordFailedAuth(email);
      // Error is already shown by the auth service
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md card-glow">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            GOLDEN PHONE
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Accedi al tuo sistema di gestione inventario
          </p>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mx-6">
            <TabsTrigger value="login">Accedi</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Inserisci la tua email"
                    maxLength={254}
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
                      placeholder="Inserisci la tua password"
                      maxLength={128}
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
                  {isLoading ? "Accesso in corso..." : "Accedi"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Nome utente (Opzionale)</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Inserisci un nome utente"
                    maxLength={50}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Inserisci la tua email"
                    maxLength={254}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crea una password (min 6 caratteri)"
                      maxLength={128}
                      minLength={6}
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

                <div className="space-y-2">
                  <Label htmlFor="role-select">Ruolo</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tuo ruolo" />
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
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? "Creazione account..." : "Registrati"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
