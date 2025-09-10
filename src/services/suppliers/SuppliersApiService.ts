import { BaseApiService } from '../core/BaseApiService';
import { supabase } from '@/integrations/supabase/client';
import type { Supplier, CreateSupplierData } from './types';

export class SuppliersApiService extends BaseApiService<Supplier, CreateSupplierData> {
  constructor() {
    super('suppliers', '*');
  }

  async create(data: CreateSupplierData): Promise<Supplier> {
    // Validate required fields
    if (!data.name?.trim()) {
      throw new Error('Supplier name is required');
    }

    // Validate email format if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate credit limit
    if (data.credit_limit && data.credit_limit < 0) {
      throw new Error('Credit limit cannot be negative');
    }

    // Check for duplicate supplier name
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('name', data.name.trim())
      .maybeSingle();

    if (existingSupplier) {
      throw new Error('A supplier with this name already exists');
    }

    return super.create({
      ...data,
      name: data.name.trim(),
      status: data.status || 'active',
      credit_limit: data.credit_limit || 0
    });
  }

  async update(id: string, data: Partial<CreateSupplierData>): Promise<Supplier> {
    // Validate email format if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate credit limit
    if (data.credit_limit !== undefined && data.credit_limit < 0) {
      throw new Error('Credit limit cannot be negative');
    }

    // Check for duplicate name if name is being updated
    if (data.name) {
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', data.name.trim())
        .neq('id', id)
        .maybeSingle();

      if (existingSupplier) {
        throw new Error('A supplier with this name already exists');
      }
    }

    // Prepare update data
    const updateData = { ...data };
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    return super.update(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    // Check if supplier has transactions
    const { data: transactions } = await supabase
      .from('supplier_transactions')
      .select('id')
      .eq('supplier_id', id)
      .limit(1);

    if (transactions && transactions.length > 0) {
      throw new Error('Cannot delete supplier with existing transactions. Consider deactivating instead.');
    }

    return super.delete(id);
  }

  async search(searchTerm: string): Promise<Supplier[]> {
    if (!searchTerm.trim()) {
      return this.getAll();
    }

    const searchFields = [
      'name', 
      'contact_person', 
      'email', 
      'phone'
    ];
    
    return super.search(searchTerm.trim(), searchFields);
  }

  async getAll(): Promise<Supplier[]> {
    return super.getAll({ orderBy: 'name', ascending: true });
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Supplier[];
  }

  async toggleStatus(id: string): Promise<Supplier> {
    // Get current status
    const supplier = await this.getById(id);
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
    
    return this.update(id, { status: newStatus });
  }

  async getSupplierStats(supplierId: string): Promise<{
    total_transactions: number;
    total_amount: number;
    pending_amount: number;
    last_transaction_date?: string;
  }> {
    const { data: transactions } = await supabase
      .from('supplier_transactions')
      .select('total_amount, status, transaction_date')
      .eq('supplier_id', supplierId)
      .order('transaction_date', { ascending: false });

    if (!transactions) {
      return {
        total_transactions: 0,
        total_amount: 0,
        pending_amount: 0
      };
    }

    const stats = {
      total_transactions: transactions.length,
      total_amount: transactions.reduce((sum, t) => sum + t.total_amount, 0),
      pending_amount: transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.total_amount, 0),
      last_transaction_date: transactions.length > 0 ? transactions[0].transaction_date : undefined
    };

    return stats;
  }
}