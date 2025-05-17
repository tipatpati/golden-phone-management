
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from './api';

// Define the Product type based on our Django model
export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | number; // Can be ID or name depending on context
  category_name?: string;    // For display purposes
  price: number;
  stock: number;
  threshold: number;
  description?: string;
  has_serial: boolean;       // Whether this product has serial numbers (like IMEI)
  serial_numbers?: string[]; // Array of serial numbers/IMEI if applicable
  barcode?: string;          // Barcode identifier
  supplier?: string;         // Supplier information
};

export function useProducts(searchTerm: string = '') {
  return useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productApi.getProducts(searchTerm),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProduct(id),
    enabled: !!id, // Only run the query if there's an ID
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (product: Omit<Product, 'id'>) => productApi.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, product }: { id: string, product: Partial<Product> }) => 
      productApi.updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
