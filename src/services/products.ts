
import { toast } from '@/components/ui/sonner';
import { buildApiUrl, getAuthHeader, handleApiError, getMockApiConfig, getApiUrl } from './config';

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

// Product API methods
export const productApi = {
  // Get all products
  async getProducts(searchTerm: string = '') {
    try {
      const queryParams = searchTerm ? `?name=${encodeURIComponent(searchTerm)}` : '';
      const url = buildApiUrl(`api/products/${queryParams}`);
      console.log(`Fetching products from: ${url}`);
      
      // Mock API support for development without backend
      if (getMockApiConfig()) {
        console.log('Using mock API data for products');
        return Promise.resolve([
          { id: 'mock-1', name: 'Mock iPhone 13', sku: 'IP13-BLK', category: 'Phones', price: 999, stock: 10, threshold: 3 },
          { id: 'mock-2', name: 'Mock Galaxy S21', sku: 'GS21-SLV', category: 'Phones', price: 899, stock: 5, threshold: 2 },
        ]);
      }
      
      const response = await fetch(url, {
        headers: getHeaders(),
        mode: 'cors', // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        // If authentication error, suggest using mock mode
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          console.log('Authentication required for API access. Consider enabling mock mode for testing.');
          throw new Error('Authentication required. Please log in or enable mock data mode for testing.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getProduct(id: string) {
    try {
      const response = await fetch(buildApiUrl(`api/products/${id}/`), {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createProduct(productData: any) {
    try {
      const url = buildApiUrl('api/products/');
      console.log('Creating product with data:', productData);
      console.log(`Sending request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
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
  
  async updateProduct(id: string, productData: any) {
    try {
      const response = await fetch(buildApiUrl(`api/products/${id}/`), {
        method: 'PATCH', // Using PATCH for partial updates
        headers: getHeaders(),
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
  
  async deleteProduct(id: string) {
    try {
      const response = await fetch(buildApiUrl(`api/products/${id}/`), {
        method: 'DELETE',
        headers: getHeaders(),
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
