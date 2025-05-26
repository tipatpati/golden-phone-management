
import { toast } from '@/components/ui/sonner';
import { buildApiUrl, toggleMockApiMode } from './config';

// Auth API methods
export const authApi = {
  // Login method with multiple endpoint attempts
  async login(username: string, password: string) {
    // List of possible authentication endpoints to try
    const authEndpoints = [
      'api/auth/token/',
      'api/token/',
      'auth/token/',
      'api/auth/login/',
      'api/login/',
      'auth/login/'
    ];
    
    let lastError: any = null;
    
    for (const endpoint of authEndpoints) {
      try {
        console.log(`Trying authentication endpoint: ${endpoint}`);
        const url = buildApiUrl(endpoint);
        console.log(`Full auth URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Store the token (handle different response formats)
          const token = data.token || data.access_token || data.key || data.auth_token;
          if (token) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('userId', data.user_id || data.id || username);
            toast.success('Logged in successfully');
            return data;
          } else {
            console.warn('No token found in response:', data);
          }
        } else if (response.status === 404) {
          // Try next endpoint
          continue;
        } else {
          // Handle other errors (400, 401, etc.)
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 400 || response.status === 401) {
            toast.error(errorData.non_field_errors?.[0] || errorData.detail || 'Invalid username or password');
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      } catch (error) {
        lastError = error;
        console.log(`Failed to authenticate with endpoint ${endpoint}:`, error);
        continue;
      }
    }
    
    // If we get here, all endpoints failed
    console.error('All authentication endpoints failed. Last error:', lastError);
    toast.error('Authentication endpoint not found. Your Django backend may not have authentication configured.', {
      description: 'Check your Django backend configuration or enable mock mode for testing.',
      duration: 8000
    });
    
    // Ask user if they want to enable mock mode
    setTimeout(() => {
      toast.info('Would you like to enable mock mode to test the interface?', {
        action: {
          label: 'Enable Mock Mode',
          onClick: () => {
            toggleMockApiMode(true);
            // Simulate successful login in mock mode
            localStorage.setItem('authToken', 'mock-token');
            localStorage.setItem('userId', username);
            window.location.reload();
          }
        },
        duration: 10000
      });
    }, 2000);
    
    throw lastError || new Error('Authentication failed - no endpoints available');
  },
  
  // Logout method
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    toast.success('Logged out successfully');
  },
  
  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem('authToken');
  }
};
