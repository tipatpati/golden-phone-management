
import { toast } from '@/components/ui/sonner';
import { buildApiUrl, getAuthHeader, getApiUrl, getMockApiConfig } from './config';

// Helper function to get headers including ngrok bypass
const getHeaders = () => {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };
  
  // Add ngrok bypass header if URL contains ngrok
  const apiUrl = getApiUrl();
  if (apiUrl.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }
  
  return headers;
};

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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10 seconds
    
    // Add more detailed logging
    const headers = getHeaders();
    console.log('Request headers:', headers);
    console.log('Making request to:', url);
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: headers,
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
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
      const responseText = await response.text();
      console.error('Response body:', responseText);
      return false;
    }
  } catch (error) {
    console.error('API connection check failed:', error);
    
    // More detailed error for timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('API connection check timed out after 10 seconds');
      toast.error('Connection to server timed out', {
        description: 'Make sure your Django backend is running at ' + getApiUrl()
      });
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Failed to fetch - this might be a CORS issue or the server is not responding');
      toast.error('Cannot reach the server', {
        description: 'Check if your Django server is running and CORS is configured properly'
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
