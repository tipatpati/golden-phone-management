
import { toast } from '@/components/ui/sonner';
import { buildApiUrl, getAuthHeader, getApiUrl, getMockApiConfig } from './config';

// Simplified API health check that actually tests your Django backend
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const url = buildApiUrl('api/products/');
    console.log(`Checking API connection at: ${url}`);
    
    // For mock API mode
    if (getMockApiConfig()) {
      console.log('Using mock API mode - connection is simulated as successful');
      return true;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Include auth header in connection check
      },
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('API connection successful');
      return true;
    } else if (response.status === 403) {
      // If we have a token but still get 403, the token might be expired
      const token = localStorage.getItem('authToken');
      if (token && token !== 'mock-token') {
        console.log('API connection failed - authentication token may be expired');
        toast.error('Authentication token expired', {
          description: 'Please log in again'
        });
        // Clear expired token
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        return false;
      } else {
        console.log('API requires authentication');
        return false;
      }
    } else {
      console.error('API health check returned non-OK response:', response.status);
      return false;
    }
  } catch (error) {
    console.error('API connection check failed:', error);
    
    // More detailed error for timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('API connection check timed out after 5 seconds');
      toast.error('Connection to server timed out', {
        description: 'Make sure your Django backend is running at ' + getApiUrl()
      });
    }
    
    return false;
  }
};

// Add this function to test the API connection on demand
export const testApiConnection = async (): Promise<void> => {
  toast.info('Testing connection to backend server...', {
    id: 'api-test',
    duration: 2000
  });
  
  const isConnected = await checkApiConnection();
  
  if (isConnected) {
    toast.success('Successfully connected to backend server!', {
      id: 'api-test',
    });
  } else {
    toast.error('Failed to connect to backend server', {
      id: 'api-test',
      description: `Make sure your Django server is running at ${getApiUrl()} and CORS is properly configured`
    });
  }
};
