
import { toast } from '@/components/ui/sonner';

// API configuration with your Django backend URL
const API_CONFIG = {
  // Set to your Django backend URL
  baseUrl: 'https://amirbenbekhti.pythonanywhere.com',
  
  // Disable mock API by default since we want real authentication
  useMockApi: false,
};

// Initialize from localStorage if previously set
const initializeApiConfig = () => {
  const storedUrl = localStorage.getItem('phoneShopApiUrl');
  const storedMockMode = localStorage.getItem('phoneShopUseMockApi');
  
  if (storedUrl) {
    API_CONFIG.baseUrl = storedUrl.trim();
    console.log('Loaded API URL from localStorage:', API_CONFIG.baseUrl);
  } else {
    // Set the default Django backend URL in localStorage
    localStorage.setItem('phoneShopApiUrl', API_CONFIG.baseUrl);
  }
  
  if (storedMockMode === 'true') {
    API_CONFIG.useMockApi = true;
    console.log('Loaded mock API mode from localStorage:', API_CONFIG.useMockApi);
  } else {
    // Ensure mock mode is disabled by default
    localStorage.setItem('phoneShopUseMockApi', 'false');
  }
};

// Initialize on module load
initializeApiConfig();

// Helper function to construct URLs properly for Django backend
export const buildApiUrl = (endpoint: string) => {
  let baseUrl = API_CONFIG.baseUrl.trim();
  
  console.log('Building Django API URL with base:', baseUrl);
  
  // Remove trailing slashes from base URL
  baseUrl = baseUrl.replace(/\/+$/, '');
  
  // Ensure we have the protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  // Clean the endpoint - remove leading slashes
  let cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  // For Django, don't automatically add 'api/' if it's already there
  if (!cleanEndpoint.startsWith('api/') && !cleanEndpoint.includes('api/')) {
    cleanEndpoint = `api/${cleanEndpoint}`;
  }
  
  const finalUrl = `${baseUrl}/${cleanEndpoint}`;
  console.log(`Django API URL: ${finalUrl}`);
  
  return finalUrl;
};

// Export this to allow changing API URL at runtime
export const getApiUrl = () => {
  return API_CONFIG.baseUrl;
};

export const setApiUrl = (url: string) => {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  API_CONFIG.baseUrl = cleanUrl;
  localStorage.setItem('phoneShopApiUrl', cleanUrl);
  console.log(`API URL updated to: ${cleanUrl}`);
  return API_CONFIG.baseUrl;
};

export const toggleMockApiMode = (useMock: boolean) => {
  API_CONFIG.useMockApi = useMock;
  localStorage.setItem('phoneShopUseMockApi', useMock ? 'true' : 'false');
  console.log(`Mock API mode set to: ${useMock}`);
  return API_CONFIG.useMockApi;
};

export const handleApiError = (error: any) => {
  console.error('Django API Error:', error);
  
  if (error.message?.includes('Failed to fetch')) {
    console.log('Django connection error details:', { 
      apiUrl: getApiUrl(),
      error: error.message 
    });
    
    toast.error('Unable to connect to Django backend', {
      description: 'Make sure your Django server is running at ' + getApiUrl(),
      duration: 5000
    });
  } else {
    toast.error('Django backend error occurred', {
      description: error.message || 'Unknown error',
      duration: 5000
    });
  }
  
  throw error;
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  // Only add auth header for real tokens
  if (token && token !== 'mock-token' && token !== 'employee-token') {
    return { 'Authorization': `Token ${token}` };
  }
  return {};
};

export const getMockApiConfig = () => API_CONFIG.useMockApi;
