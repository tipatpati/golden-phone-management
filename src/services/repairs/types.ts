import type { BaseEntity } from '../core/BaseApiService';

export interface Repair extends BaseEntity {
  repair_number: string;
  client_id?: string;
  technician_id?: string;
  device: string;
  imei?: string;
  issue: string;
  status: 'quoted' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  cost: number;
  parts_cost: number;
  labor_cost: number;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  notes?: string;
  client?: {
    id: string;
    type: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
  };
  technician?: {
    id: string;
    username?: string;
  };
  repair_parts?: RepairPart[];
}

export interface RepairPart {
  id: string;
  repair_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  product?: {
    id: string;
    brand: string;
    model: string;
  };
}

export type CreateRepairData = {
  client_id?: string;
  technician_id?: string;
  device: string;
  imei?: string;
  issue: string;
  status?: 'quoted' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  cost?: number;
  parts_cost?: number;
  labor_cost?: number;
  estimated_completion_date?: string;
  notes?: string;
  repair_parts?: {
    product_id: string;
    quantity: number;
    unit_cost: number;
  }[];
};