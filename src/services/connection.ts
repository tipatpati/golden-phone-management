
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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds
    
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
    } else if (response.status === 404) {
      console.error('API endpoint not found - check your Django URL configuration');
      const responseText = await response.text();
      console.error('404 Response body:', responseText);
      toast.error('API endpoint not found', {
        description: 'Check that your Django server has the /api/products/ endpoint configured'
      });
      return false;
    } else if (response.status === 400) {
      console.error('Bad request - checking for DisallowedHost error');
      const responseText = await response.text();
      console.error('400 Response body:', responseText);
      
      if (responseText.includes('DisallowedHost') || responseText.includes('ALLOWED_HOSTS')) {
        toast.error('Django ALLOWED_HOSTS configuration error', {
          description: `Add '${new URL(url).hostname}' to your Django ALLOWED_HOSTS setting`
        });
      } else {
        toast.error('Server returned bad request', {
          description: 'Check Django server logs for details'
        });
      }
      return false;
    } else {
      console.error('API health check returned non-OK response:', response.status);
      const responseText = await response.text();
      console.error('Response body:', responseText);
      return false;
    }
  } catch (error) {
    console.error('API connection check failed:', error);
    
    // More detailed error handling
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('API connection check timed out after 15 seconds');
      toast.error('Connection to server timed out', {
        description: 'Make sure your Django backend is running at ' + getApiUrl()
      });
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Failed to fetch - this might be a CORS issue or the server is not responding');
      toast.error('Cannot reach the server', {
        description: 'Check if your Django server is running and CORS is configured properly'
      });
    } else {
      console.error('Unexpected error during API connection check:', error);
      toast.error('Unexpected connection error', {
        description: error.message || 'Unknown error occurred'
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

// Add a specific function to test different URLs
export const testSpecificUrl = async (testUrl: string): Promise<boolean> => {
  try {
    console.log(`Testing specific URL: ${testUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    console.log(`Test URL ${testUrl} returned status: ${response.status}`);
    
    return response.ok;
  } catch (error) {
    console.error(`Test URL ${testUrl} failed:`, error);
    return false;
  }
};
