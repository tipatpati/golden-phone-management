
import { toast } from '@/components/ui/sonner';
import { buildApiUrl, getMockApiConfig } from './config';

// Auth API methods for Django backend
export const authApi = {
  // Updated login method to handle mock mode
  async login(username: string, password: string) {
    console.log('authApi.login: Starting authentication...');
    console.log('authApi.login: Username:', username);
    
    // Check if we're in mock mode
    const useMockApi = getMockApiConfig();
    
    if (useMockApi) {
      console.log('authApi.login: Using mock authentication');
      
      // Simple mock validation - accept any non-empty credentials
      if (!username || !password) {
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
          username: username,
          role: 'admin' // Default to admin in mock mode
        }
      };
      
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userId', username);
      localStorage.setItem('userRole', 'admin');
      
      toast.success('Mock login successful!', {
        description: 'You are now logged in with mock data'
      });
      
      console.log('authApi.login: Mock authentication successful');
      return mockResponse;
    }
    
    // Real Django backend authentication (existing code)
    console.log('authApi.login: Using real Django backend authentication...');
    
    // Your Django backend should have an authentication endpoint
    const authEndpoints = [
      'api/auth/login/',
      'api/token/',
      'api/auth/token/',
      'auth/login/',
      'auth/token/',
      'api/accounts/login/',
      'accounts/login/'
    ];
    
    let lastError: any = null;
    
    for (const endpoint of authEndpoints) {
      try {
        console.log(`authApi.login: Trying Django auth endpoint: ${endpoint}`);
        const url = buildApiUrl(endpoint);
        console.log(`authApi.login: Full Django auth URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          mode: 'cors',
        });
        
        console.log(`authApi.login: Django auth response status: ${response.status}`);
        console.log('authApi.login: Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('authApi.login: Django auth successful, response:', data);
          
          // Handle different Django auth response formats
          const token = data.token || data.access_token || data.key || data.auth_token;
          
          if (token) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('userId', data.user?.username || data.username || username);
            
            // Store user role if provided by Django
            if (data.user?.role || data.role) {
              localStorage.setItem('userRole', data.user?.role || data.role);
            }
            
            toast.success('Successfully logged in to Django backend');
            return data;
          } else {
            console.warn('authApi.login: No authentication token in Django response:', data);
            throw new Error('No authentication token received');
          }
        } else if (response.status === 404) {
          console.log(`authApi.login: Endpoint ${endpoint} not found, trying next...`);
          // Try next endpoint
          continue;
        } else {
          // Handle authentication errors
          const errorText = await response.text();
          console.log(`authApi.login: Error response text: ${errorText}`);
          
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            console.log('authApi.login: Could not parse error response as JSON');
          }
          
          if (response.status === 400 || response.status === 401) {
            const errorMessage = errorData.non_field_errors?.[0] || 
                               errorData.detail || 
                               errorData.error || 
                               errorText ||
                               'Invalid username or password';
            console.log(`authApi.login: Authentication failed: ${errorMessage}`);
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
          
          throw new Error(`Django authentication failed: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        lastError = error;
        console.log(`authApi.login: Django auth failed for endpoint ${endpoint}:`, error);
        
        // If it's a network error, don't try other endpoints
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          break;
        }
        
        continue;
      }
    }
    
    // If all endpoints failed
    console.error('authApi.login: All Django authentication endpoints failed. Last error:', lastError);
    
    if (lastError instanceof TypeError && lastError.message === 'Failed to fetch') {
      toast.error('Cannot connect to Django backend', {
        description: 'Please check that your Django server is running and accessible, or enable mock mode',
        duration: 8000
      });
    } else {
      toast.error('Authentication failed', {
        description: lastError?.message || 'Please check your credentials and try again',
        duration: 8000
      });
    }
    
    throw lastError || new Error('Django authentication failed - no endpoints available');
  },
  
  // Updated logout method
  logout() {
    const token = localStorage.getItem('authToken');
    
    // If we have a real token, try to logout from Django backend
    if (token && !token.startsWith('mock-')) {
      // Optionally call Django logout endpoint
      const logoutUrl = buildApiUrl('api/auth/logout/');
      fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.log('authApi.logout: Django logout endpoint call failed (this is usually fine):', error);
      });
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    toast.success('Logged out successfully');
  },
  
  // Check if user is logged in with real or mock token
  isLoggedIn() {
    const token = localStorage.getItem('authToken');
    return !!token;
  }
};
