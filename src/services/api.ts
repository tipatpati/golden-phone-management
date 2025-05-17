
import { toast } from '@/components/ui/sonner';

// Update this URL to match your actual Django backend
const API_URL = 'http://127.0.0.1:8000/api';  // Adjust this if your Django server runs on a different port/URL

// More detailed error handler
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.message?.includes('Failed to fetch')) {
    console.log('Connection error details:', { 
      apiUrl: API_URL,
      error: error.message 
    });
    
    toast.error('Unable to connect to the server. Please check your internet connection or try again later.', {
      description: 'Make sure your Django backend is running at ' + API_URL,
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
      console.log(`Fetching products from: ${API_URL}/products/${searchTerm ? '?name=' + encodeURIComponent(searchTerm) : ''}`);
      
      const queryParams = searchTerm ? `?name=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`${API_URL}/products/${queryParams}`, {
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
      const response = await fetch(`${API_URL}/products/${id}/`, {
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
      console.log('Creating product with data:', productData);
      console.log(`Sending request to: ${API_URL}/products/`);
      
      const response = await fetch(`${API_URL}/products/`, {
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
      const response = await fetch(`${API_URL}/products/${id}/`, {
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
      const response = await fetch(`${API_URL}/products/${id}/`, {
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
      const response = await fetch(`${API_URL}/auth/token/`, {
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

// Add a more robust API health check
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    console.log(`Checking API connection at: ${API_URL}/health-check/`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/health-check/`, { 
      method: 'GET',
      headers: {
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
        description: 'Make sure your Django backend is running at ' + API_URL
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
      description: `Make sure your Django server is running at ${API_URL} and CORS is properly configured`
    });
  }
};
