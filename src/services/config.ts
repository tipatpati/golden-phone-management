
import { toast } from '@/components/ui/sonner';

// API configuration with flexible URL options
const API_CONFIG = {
  // Default to your PythonAnywhere URL
  baseUrl: 'https://amirbenbekhti.pythonanywhere.com',
  
  // Add any mock/demo API flag for development/testing without backend
  useMockApi: false,
};

// Helper function to construct URLs properly
export const buildApiUrl = (endpoint: string) => {
  let baseUrl = API_CONFIG.baseUrl.trim();
  
  // Remove trailing slashes from base URL
  baseUrl = baseUrl.replace(/\/+$/, '');
  
  // Only add protocol if it's completely missing
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  // Clean the endpoint - remove leading slashes and ensure it doesn't start with api/
  let cleanEndpoint = endpoint.replace(/^\/+/, '');
  if (!cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = `api/${cleanEndpoint}`;
  }
  
  // Simple URL construction
  const finalUrl = `${baseUrl}/${cleanEndpoint}`;
  console.log(`Building API URL: ${finalUrl}`);
  
  return finalUrl;
};

// Export this to allow changing API URL at runtime
export const getApiUrl = () => API_CONFIG.baseUrl;

export const setApiUrl = (url: string) => {
  // Clean the URL when setting it
  const cleanUrl = url.trim().replace(/\/+$/, '');
  API_CONFIG.baseUrl = cleanUrl;
  localStorage.setItem('phoneShopApiUrl', cleanUrl);
  console.log(`API URL updated to: ${cleanUrl}`);
  return API_CONFIG.baseUrl;
};

// Initialize from localStorage if previously set
if (localStorage.getItem('phoneShopApiUrl')) {
  const storedUrl = localStorage.getItem('phoneShopApiUrl') || API_CONFIG.baseUrl;
  API_CONFIG.baseUrl = storedUrl.trim();
}

// Toggle mock API mode (for development without backend)
export const toggleMockApiMode = (useMock: boolean) => {
  API_CONFIG.useMockApi = useMock;
  localStorage.setItem('phoneShopUseMockApi', useMock ? 'true' : 'false');
  return API_CONFIG.useMockApi;
};

// Initialize mock mode from localStorage if previously set
if (localStorage.getItem('phoneShopUseMockApi') === 'true') {
  API_CONFIG.useMockApi = true;
}

// More detailed error handler
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.message?.includes('Failed to fetch')) {
    console.log('Connection error details:', { 
      apiUrl: getApiUrl(),
      error: error.message 
    });
    
    toast.error('Unable to connect to the server. Please check your internet connection or try again later.', {
      description: 'Make sure your Django backend is running at ' + getApiUrl(),
      duration: 5000
    });
  } else {
    toast.error('An error occurred while connecting to the server', {
      description: error.message || 'Unknown error',
      duration: 5000
    });
  }
  
  throw error;
};

// Auth header helper
export const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Token ${token}` } : {};
};

// Get mock API config
export const getMockApiConfig = () => API_CONFIG.useMockApi;
