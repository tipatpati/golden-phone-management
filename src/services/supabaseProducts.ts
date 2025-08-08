import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  brand: string;
  model: string;
  year?: number;
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
  brand: string;
  model: string;
  year?: number;
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
    console.log('Fetching products from Supabase with search term:', searchTerm);
    
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name)
      `);
    
    if (searchTerm) {
      const search = searchTerm.trim();
      console.log('Applying search filter for:', search);
      
      // Search across brand, model, barcode, and serial numbers
      // Also search for combined brand + model
      query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%,barcode.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    console.log('Raw data from Supabase:', data);
    
    // If we have a search term, also do client-side filtering for combined brand+model matches
    let filteredData = data || [];
    
    if (searchTerm && filteredData.length === 0) {
      // Try a broader search without the term
      console.log('No results found, trying broader search...');
      const { data: allData } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `)
        .order('created_at', { ascending: false });
      
      // Filter client-side for combined brand+model matches
      const search = searchTerm.toLowerCase().trim();
      filteredData = allData?.filter(product => {
        const brandModel = `${product.brand} ${product.model}`.toLowerCase();
        const brand = product.brand?.toLowerCase() || '';
        const model = product.model?.toLowerCase() || '';
        const barcode = product.barcode?.toLowerCase() || '';
        
        return brandModel.includes(search) || 
               brand.includes(search) || 
               model.includes(search) || 
               barcode.includes(search) ||
               (product.serial_numbers && product.serial_numbers.some(serial => 
                 serial.toLowerCase().includes(search)
               ));
      }) || [];
      
      console.log('Client-side filtered results:', filteredData);
    }
    
    // Transform the data to match the expected format
    const transformedData = filteredData.map(product => ({
      ...product,
      category_name: product.category?.name,
    }));
    
    console.log('Final transformed data:', transformedData);
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
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Product not found');
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
          brand,
          model,
          year,
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
