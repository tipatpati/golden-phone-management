
import { toast } from '@/components/ui/sonner';

// API configuration for mock mode only
const API_CONFIG = {
  // Enable mock API by default since we're removing Django
  useMockApi: true,
};

// Initialize from localStorage if previously set
const initializeApiConfig = () => {
  const storedMockMode = localStorage.getItem('phoneShopUseMockApi');
  
  if (storedMockMode === 'false') {
    API_CONFIG.useMockApi = false;
    console.log('Loaded mock API mode from localStorage:', API_CONFIG.useMockApi);
  } else {
    // Default to mock mode
    localStorage.setItem('phoneShopUseMockApi', 'true');
    API_CONFIG.useMockApi = true;
  }
};

// Initialize on module load
initializeApiConfig();

export const toggleMockApiMode = (useMock: boolean) => {
  API_CONFIG.useMockApi = useMock;
  localStorage.setItem('phoneShopUseMockApi', useMock ? 'true' : 'false');
  console.log(`Mock API mode set to: ${useMock}`);
  return API_CONFIG.useMockApi;
};

export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.message?.includes('Failed to fetch')) {
    toast.error('Unable to connect to backend', {
      description: 'Using mock data instead',
      duration: 5000
    });
  } else {
    toast.error('API error occurred', {
      description: error.message || 'Unknown error',
      duration: 5000
    });
  }
  
  throw error;
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  // Only add auth header for real Supabase tokens
  if (token && token !== 'mock-token' && token !== 'employee-token') {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};

export const getMockApiConfig = () => API_CONFIG.useMockApi;
