
import React, { useState } from "react";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/enhanced-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { useForm } from "@/hooks/useForm";
import { LoginSchema } from "@/schemas/validation";
import { useErrorHandler } from "@/utils/errorHandler";
import { LoginFormData } from "@/schemas/validation";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("salesperson");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const { login, signup } = useAuth();
  const { handleError } = useErrorHandler('LoginForm');
  
  // Login form with validation
  const loginForm = useForm<LoginFormData>(
    { email: '', password: '' },
    LoginSchema,
    'LoginForm'
  );
  
  // Signup form - using separate state for additional fields
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    username: ''
  });

  const handleLogin = async () => {
    await loginForm.handleSubmit(
      async (data) => {
        await login(data.email, data.password);
        onLoginSuccess();
      },
      () => {
        // Success handled in submit function
      },
      (error) => {
        handleError(error, 'login');
      }
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password) {
      handleError(new Error('Email and password are required'), 'validation', true);
      return;
    }
    
    try {
      await signup(signupData.email, signupData.password, signupData.username, selectedRole);
      setActiveTab("login");
      setSignupData({ email: '', password: '', username: '' });
    } catch (error) {
      handleError(error, 'signup');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
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
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.data.email}
                    onChange={(e) => loginForm.updateField('email', e.target.value)}
                    placeholder="Inserisci la tua email"
                    maxLength={254}
                    required
                  />
                  {loginForm.getFieldError('email') && (
                    <p className="text-sm text-destructive">{loginForm.getFieldError('email')}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.data.password}
                      onChange={(e) => loginForm.updateField('password', e.target.value)}
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
                  {loginForm.getFieldError('password') && (
                    <p className="text-sm text-destructive">{loginForm.getFieldError('password')}</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginForm.isLoading}
                >
                  {loginForm.isLoading ? "Accesso in corso..." : "Accedi"}
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
                    value={signupData.username}
                    onChange={(e) => setSignupData(prev => ({...prev, username: e.target.value}))}
                    placeholder="Inserisci un nome utente"
                    maxLength={50}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData(prev => ({...prev, email: e.target.value}))}
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
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({...prev, password: e.target.value}))}
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
                  disabled={loginForm.isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loginForm.isLoading ? "Creazione account..." : "Registrati"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
