import { BaseApiService } from '../core/BaseApiService';
import type { Product, CreateProductData } from './types';

export class ProductApiService extends BaseApiService<Product, CreateProductData> {
  constructor() {
    super('products', `
      *,
      category:categories(id, name)
    `);
  }

  protected transformProduct(product: any): Product {
    return {
      ...product,
      category_name: product.category?.name,
    };
  }

  async getAll(filters = {}): Promise<Product[]> {
    const data = await super.getAll(filters);
    return data.map(this.transformProduct);
  }

  async getById(id: string): Promise<Product> {
    const data = await super.getById(id);
    return this.transformProduct(data);
  }

  async create(productData: CreateProductData): Promise<Product> {
    const data = await super.create(productData);
    return this.transformProduct(data);
  }

  async update(id: string, productData: Partial<CreateProductData>): Promise<Product> {
    const data = await super.update(id, productData);
    return this.transformProduct(data);
  }

  async search(searchTerm: string): Promise<Product[]> {
    if (!searchTerm) return this.getAll();

    // First try database search
    const searchFields = ['brand', 'model', 'barcode'];
    let results = await super.search(searchTerm, searchFields);

    // If no results, try broader client-side search
    if (results.length === 0) {
      const allProducts = await this.getAll();
      const search = searchTerm.toLowerCase().trim();
      
      results = allProducts.filter(product => {
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
      });
    }

    return results.map(this.transformProduct);
  }

  async getCategories() {
    return this.performQuery(
      this.supabase
        .from('categories' as any)
        .select('*')
        .order('name'),
      'fetching categories'
    );
  }

  async getProductRecommendations(productId: string) {
    const data = await this.performQuery(
      this.supabase
        .from('product_recommendations' as any)
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
        .order('priority', { ascending: true }),
      'fetching recommendations'
    );

    return Array.isArray(data) ? data.map(rec => ({
      ...rec.recommended_product,
      category_name: rec.recommended_product?.category?.name,
      recommendation_type: rec.recommendation_type,
      priority: rec.priority
    })) : [];
  }
}