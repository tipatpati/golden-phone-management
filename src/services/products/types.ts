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
  price?: number;       // Optional default price for new units
  min_price?: number;   // Optional default min price for new units
  max_price?: number;   // Optional default max price for new units
  stock: number;
  threshold: number;
  description?: string;
  has_serial: boolean;
  serial_numbers?: string[];
  barcode?: string;
  supplier?: string;
}

export type CreateProductData = Omit<Product, keyof BaseEntity | 'category' | 'category_name'>;