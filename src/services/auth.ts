
import { toast } from '@/components/ui/sonner';
import { buildApiUrl } from './config';

// Auth API methods for Django backend
export const authApi = {
  // Updated login method specifically for Django backend
  async login(username: string, password: string) {
    console.log('Attempting to authenticate with Django backend...');
    
    // Your Django backend should have an authentication endpoint
    const authEndpoints = [
      'api/auth/login/',
      'api/token/',
      'api/auth/token/',
      'auth/login/',
      'auth/token/'
    ];
    
    let lastError: any = null;
    
    for (const endpoint of authEndpoints) {
      try {
        console.log(`Trying Django auth endpoint: ${endpoint}`);
        const url = buildApiUrl(endpoint);
        console.log(`Full Django auth URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          mode: 'cors',
        });
        
        console.log(`Django auth response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Django auth successful, response:', data);
          
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
            console.warn('No authentication token in Django response:', data);
            throw new Error('No authentication token received');
          }
        } else if (response.status === 404) {
          // Try next endpoint
          continue;
        } else {
          // Handle authentication errors
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 400 || response.status === 401) {
            const errorMessage = errorData.non_field_errors?.[0] || 
                               errorData.detail || 
                               errorData.error || 
                               'Invalid username or password';
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
          
          throw new Error(`Django authentication failed: ${response.status}`);
        }
      } catch (error) {
        lastError = error;
        console.log(`Django auth failed for endpoint ${endpoint}:`, error);
        continue;
      }
    }
    
    // If all endpoints failed
    console.error('All Django authentication endpoints failed. Last error:', lastError);
    toast.error('Cannot connect to Django authentication server', {
      description: 'Please check that your Django backend is running and properly configured',
      duration: 8000
    });
    
    throw lastError || new Error('Django authentication failed - no endpoints available');
  },
  
  // Updated logout method
  logout() {
    const token = localStorage.getItem('authToken');
    
    // If we have a real token, try to logout from Django backend
    if (token && token !== 'mock-token' && token !== 'employee-token') {
      // Optionally call Django logout endpoint
      const logoutUrl = buildApiUrl('api/auth/logout/');
      fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.log('Django logout endpoint call failed (this is usually fine):', error);
      });
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    toast.success('Logged out successfully');
  },
  
  // Check if user is logged in with real token
  isLoggedIn() {
    const token = localStorage.getItem('authToken');
    return !!(token && token !== 'mock-token' && token !== 'employee-token');
  }
};
