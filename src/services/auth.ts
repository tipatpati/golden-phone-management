
import { toast } from '@/components/ui/sonner';
import { getMockApiConfig } from './config';
import { secureStorage } from './secureStorage';
import { sanitizeInput, sanitizeEmail } from '@/utils/inputSanitizer';

// Auth API methods for Supabase and mock mode only
export const authApi = {
  // Updated login method to handle mock mode only (no Django)
  async login(username: string, password: string) {
    console.log('authApi.login: Starting authentication...');
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeEmail(username) || sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedUsername || !sanitizedPassword) {
      toast.error('Invalid credentials provided');
      throw new Error('Invalid credentials');
    }
    
    console.log('authApi.login: Username:', sanitizedUsername);
    
    // Check if we're in mock mode
    const useMockApi = getMockApiConfig();
    
    if (useMockApi) {
      console.log('authApi.login: Using mock authentication');
      
      // Simple mock validation - accept any non-empty credentials
      if (!sanitizedUsername || !sanitizedPassword) {
        toast.error('Please enter both username and password');
        throw new Error('Username and password required');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockToken = 'mock-auth-token-' + Date.now();
      const mockResponse = {
        token: mockToken,
        user: {
          username: sanitizedUsername,
          role: 'admin' // Default to admin in mock mode
        }
      };
      
      // Use secure storage for sensitive data
      secureStorage.setItem('authToken', mockToken, true);
      secureStorage.setItem('userId', sanitizedUsername, false);
      secureStorage.setItem('userRole', 'admin', false);
      
      toast.success('Mock login successful!', {
        description: 'You are now logged in with mock data'
      });
      
      console.log('authApi.login: Mock authentication successful');
      return mockResponse;
    }
    
    // For non-mock mode, this would be handled by Supabase directly
    // This auth service is mainly for mock mode now
    throw new Error('Use Supabase authentication for real auth');
  },
  
  // Updated logout method
  logout() {
    secureStorage.removeItem('authToken');
    secureStorage.removeItem('userId');
    secureStorage.removeItem('userRole');
    toast.success('Logged out successfully');
  },
  
  // Check if user is logged in with real or mock token
  isLoggedIn() {
    const token = secureStorage.getItem('authToken', true);
    return !!token;
  }
};
