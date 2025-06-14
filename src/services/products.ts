
import { toast } from '@/components/ui/sonner';
import { getMockApiConfig, handleApiError } from './config';

// Mock data for testing
const mockProducts = [
  {
    id: 1,
    name: "iPhone 14 Pro",
    category: "smartphones",
    brand: "Apple",
    model: "iPhone 14 Pro",
    price: 999.00,
    stock_quantity: 15,
    serial_numbers: ["A1234567890", "A1234567891"],
    condition: "new",
    description: "Latest iPhone with Pro camera system",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: 2,
    name: "Samsung Galaxy S23",
    category: "smartphones",
    brand: "Samsung",
    model: "Galaxy S23",
    price: 799.00,
    stock_quantity: 8,
    serial_numbers: ["S1234567890"],
    condition: "new",
    description: "Premium Android smartphone",
    created_at: "2024-01-16T11:00:00Z",
    updated_at: "2024-01-16T11:00:00Z"
  }
];

export const productsApi = {
  async getProducts() {
    try {
      if (getMockApiConfig()) {
        console.log('Using mock products data');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockProducts;
      }

      // For Supabase, this would be handled by the supabaseProducts service
      throw new Error('Use Supabase products service for real data');
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  async createProduct(productData: any) {
    try {
      if (getMockApiConfig()) {
        console.log('Creating mock product:', productData);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newProduct = {
          id: Date.now(),
          ...productData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockProducts.push(newProduct);
        toast.success('Product created successfully (mock)');
        return newProduct;
      }

      // For Supabase, this would be handled by the supabaseProducts service
      throw new Error('Use Supabase products service for real data');
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async updateProduct(id: number, productData: any) {
    try {
      if (getMockApiConfig()) {
        console.log('Updating mock product:', id, productData);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const index = mockProducts.findIndex(p => p.id === id);
        if (index !== -1) {
          mockProducts[index] = {
            ...mockProducts[index],
            ...productData,
            updated_at: new Date().toISOString()
          };
          toast.success('Product updated successfully (mock)');
          return mockProducts[index];
        }
        throw new Error('Product not found');
      }

      // For Supabase, this would be handled by the supabaseProducts service
      throw new Error('Use Supabase products service for real data');
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async deleteProduct(id: number) {
    try {
      if (getMockApiConfig()) {
        console.log('Deleting mock product:', id);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const index = mockProducts.findIndex(p => p.id === id);
        if (index !== -1) {
          mockProducts.splice(index, 1);
          toast.success('Product deleted successfully (mock)');
          return;
        }
        throw new Error('Product not found');
      }

      // For Supabase, this would be handled by the supabaseProducts service
      throw new Error('Use Supabase products service for real data');
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};
