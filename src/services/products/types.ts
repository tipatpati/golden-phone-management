import type { BaseEntity } from '../core/BaseApiService';

export interface Product extends BaseEntity {
  brand: string;
  model: string;
  year?: number;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
  category_name?: string;
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
}

export type CreateProductData = Omit<Product, keyof BaseEntity | 'category' | 'category_name'>;