
import { toast } from '@/components/ui/sonner';

// API configuration with flexible URL options
// 1. Use environment variable if available
// 2. Fall back to a configuration value that can be changed
// 3. Finally fall back to localhost for development
const API_CONFIG = {
  // Default to your PythonAnywhere URL
  baseUrl: 'https://amirbenbekhti.pythonanywhere.com',
  
  // Add any mock/demo API flag for development/testing without backend
  useMockApi: false,
};

// Helper function to construct URLs properly without double slashes
const buildApiUrl = (endpoint: string) => {
  const baseUrl = API_CONFIG.baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
  return `${baseUrl}/${cleanEndpoint}`;
};

// Export this to allow changing API URL at runtime
export const getApiUrl = () => API_CONFIG.baseUrl;
export const setApiUrl = (url: string) => {
  API_CONFIG.baseUrl = url;
  localStorage.setItem('phoneShopApiUrl', url);
  return API_CONFIG.baseUrl;
};

// Initialize from localStorage if previously set
if (localStorage.getItem('phoneShopApiUrl')) {
  API_CONFIG.baseUrl = localStorage.getItem('phoneShopApiUrl') || API_CONFIG.baseUrl;
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
const handleApiError = (error: any) => {
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
const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Token ${token}` } : {};
};

// Product API methods
export const productApi = {
  // Get all products
  async getProducts(searchTerm: string = '') {
    try {
      const queryParams = searchTerm ? `?name=${encodeURIComponent(searchTerm)}` : '';
      const url = buildApiUrl(`api/products/${queryParams}`);
      console.log(`Fetching products from: ${url}`);
      
      // Mock API support for development without backend
      if (API_CONFIG.useMockApi) {
        console.log('Using mock API data for products');
        return Promise.resolve([
          { id: 'mock-1', name: 'Mock iPhone 13', sku: 'IP13-BLK', category: 'Phones', price: 999, stock: 10, threshold: 3 },
          { id: 'mock-2', name: 'Mock Galaxy S21', sku: 'GS21-SLV', category: 'Phones', price: 899, stock: 5, threshold: 2 },
        ]);
      }
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get a single product by ID
  async getProduct(id: string) {
    try {
      const response = await fetch(buildApiUrl(`api/products/${id}/`), {
        headers: {
          ...getAuthHeader(),
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Create a new product
  async createProduct(productData: any) {
    try {
      const url = buildApiUrl('api/products/');
      console.log('Creating product with data:', productData);
      console.log(`Sending request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(productData),
        mode: 'cors', // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        let errorMessage = `HTTP error! Status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          // If it's not valid JSON, use the raw text
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      toast.success('Product created successfully');
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Update an existing product
  async updateProduct(id: string, productData: any) {
    try {
      const response = await fetch(buildApiUrl(`api/products/${id}/`), {
        method: 'PATCH', // Using PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      toast.success('Product updated successfully');
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Delete a product
  async deleteProduct(id: string) {
    try {
      const response = await fetch(buildApiUrl(`api/products/${id}/`), {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      toast.success('Product deleted successfully');
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Auth API methods
export const authApi = {
  // Login method
  async login(username: string, password: string) {
    try {
      const response = await fetch(buildApiUrl('api/auth/token/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.non_field_errors?.[0] || 'Invalid username or password');
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      // Store the token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user_id);
      
      toast.success('Logged in successfully');
      return data;
    } catch (error) {
      return handleApiError(error);
    }
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

// Simplified API health check that actually tests your Django backend
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const url = buildApiUrl('api/products/');
    console.log(`Checking API connection at: ${url}`);
    
    // For mock API mode
    if (API_CONFIG.useMockApi) {
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
      },
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('API connection successful');
      return true;
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
