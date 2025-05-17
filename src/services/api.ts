import { toast } from '@/components/ui/sonner';

const API_URL = 'http://127.0.0.1:8000/api';  // Replace with your actual Django API URL

// Error handler helper
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  // More specific error handling
  if (error.message?.includes('Failed to fetch')) {
    toast.error('Unable to connect to the server. Please check your internet connection or try again later.');
  } else {
    toast.error('An error occurred while connecting to the server');
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
      const response = await fetch(`${API_URL}/products/${queryParams}`, {
        headers: {
          ...getAuthHeader(),
        }
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
      const response = await fetch(`${API_URL}/products/`, {
        method: 'POST',
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
    const response = await fetch(`${API_URL}/health-check/`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};
