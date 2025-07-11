import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
  category_name?: string; // Add this for compatibility
  price: number;
  min_price: number;
  max_price: number;
  stock: number;
  threshold: number;
  description?: string;
  has_serial: boolean;
  serial_numbers?: string[];
  barcode?: string;
  supplier?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateProductData = {
  name: string;
  sku: string;
  category_id: number;
  price: number;
  min_price: number;
  max_price: number;
  stock: number;
  threshold: number;
  description?: string;
  has_serial: boolean;
  serial_numbers?: string[];
  barcode?: string;
  supplier?: string;
};

export const supabaseProductApi = {
  async getProducts(searchTerm: string = '') {
    console.log('Fetching products from Supabase...');
    
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name)
      `);
    
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    // Transform the data to match the expected format
    const transformedData = data?.map(product => ({
      ...product,
      category_name: product.category?.name,
    })) || [];
    
    console.log('Products fetched successfully:', transformedData);
    return transformedData;
  },

  async getProduct(id: string) {
    console.log('Fetching product:', id);
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
    
    return {
      ...data,
      category_name: data.category?.name,
    };
  },

  async createProduct(productData: CreateProductData) {
    console.log('Creating product:', productData);
    
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select(`
        *,
        category:categories(id, name)
      `)
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    
    console.log('Product created successfully:', data);
    return {
      ...data,
      category_name: data.category?.name,
    };
  },

  async updateProduct(id: string, productData: Partial<CreateProductData>) {
    console.log('Updating product:', id, productData);
    
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name)
      `)
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    
    console.log('Product updated successfully:', data);
    return {
      ...data,
      category_name: data.category?.name,
    };
  },

  async deleteProduct(id: string) {
    console.log('Deleting product:', id);
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
    
    console.log('Product deleted successfully');
    return true;
  },

  async getCategories() {
    console.log('Fetching categories from Supabase...');
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    console.log('Categories fetched successfully:', data);
    return data || [];
  },

  async getProductRecommendations(productId: string) {
    console.log('Fetching recommendations for product:', productId);
    
    const { data, error } = await supabase
      .from('product_recommendations')
      .select(`
        id,
        recommendation_type,
        priority,
        recommended_product:products!recommended_product_id(
          id,
          name,
          sku,
          price,
          min_price,
          max_price,
          stock,
          category:categories(id, name)
        )
      `)
      .eq('product_id', productId)
      .order('priority', { ascending: true });
    
    if (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
    
    const transformedData = data?.map(rec => ({
      ...rec.recommended_product,
      category_name: rec.recommended_product?.category?.name,
      recommendation_type: rec.recommendation_type,
      priority: rec.priority
    })) || [];
    
    console.log('Recommendations fetched successfully:', transformedData);
    return transformedData;
  }
};
