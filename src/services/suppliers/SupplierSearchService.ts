import { supabase } from '@/integrations/supabase/client';

export interface SupplierSearchResult {
  type: 'supplier' | 'transaction' | 'unit';
  id: string;
  // Supplier fields
  supplier_id?: string;
  supplier_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status?: string;
  // Transaction fields
  transaction_id?: string;
  transaction_number?: string;
  transaction_type?: string;
  transaction_date?: string;
  total_amount?: number;
  // Unit fields
  unit_id?: string;
  serial_number?: string;
  barcode?: string;
  product_brand?: string;
  product_model?: string;
  unit_status?: string;
  purchase_price?: number;
}

export class SupplierSearchService {
  /**
   * Unified search across suppliers, transactions, and product units
   */
  static async search(searchTerm: string): Promise<SupplierSearchResult[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const term = searchTerm.trim().toLowerCase();
    const results: SupplierSearchResult[] = [];

    // Check if it looks like a serial number (alphanumeric, could be IMEI)
    const isSerialLike = /^[a-zA-Z0-9-]+$/.test(term);
    
    // Parallel searches for better performance
    const [supplierResults, transactionResults, unitResults] = await Promise.all([
      this.searchSuppliers(term),
      this.searchTransactions(term),
      isSerialLike ? this.searchUnits(term) : Promise.resolve([])
    ]);

    results.push(...supplierResults, ...transactionResults, ...unitResults);

    return results;
  }

  /**
   * Search suppliers by name, contact person, email, phone
   */
  private static async searchSuppliers(term: string): Promise<SupplierSearchResult[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`name.ilike.%${term}%,contact_person.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
      .order('name');

    if (error) {
      console.error('Error searching suppliers:', error);
      return [];
    }

    return (data || []).map(supplier => ({
      type: 'supplier' as const,
      id: supplier.id,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      status: supplier.status
    }));
  }

  /**
   * Search transactions by transaction number, supplier name, notes
   */
  private static async searchTransactions(term: string): Promise<SupplierSearchResult[]> {
    const { data, error } = await supabase
      .from('supplier_transactions')
      .select(`
        *,
        suppliers (
          id,
          name
        )
      `)
      .or(`transaction_number.ilike.%${term}%,notes.ilike.%${term}%`)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error searching transactions:', error);
      return [];
    }

    // Also search by supplier name
    const { data: supplierData } = await supabase
      .from('supplier_transactions')
      .select(`
        *,
        suppliers!inner (
          id,
          name
        )
      `)
      .ilike('suppliers.name', `%${term}%`)
      .order('transaction_date', { ascending: false });

    const combinedData = [...(data || []), ...(supplierData || [])];
    
    // Remove duplicates
    const uniqueTransactions = Array.from(
      new Map(combinedData.map(t => [t.id, t])).values()
    );

    return uniqueTransactions.map(transaction => ({
      type: 'transaction' as const,
      id: transaction.id,
      transaction_id: transaction.id,
      transaction_number: transaction.transaction_number,
      transaction_type: transaction.type,
      transaction_date: transaction.transaction_date,
      total_amount: transaction.total_amount,
      supplier_id: transaction.supplier_id,
      supplier_name: transaction.suppliers?.name,
      status: transaction.status
    }));
  }

  /**
   * Search product units by serial number, IMEI, last 4 digits, or barcode (includes sold units)
   */
  private static async searchUnits(term: string): Promise<SupplierSearchResult[]> {
    // Search both active and sold units in parallel
    const [activeUnitsResult, soldUnitsResult] = await Promise.all([
      supabase
        .from('product_units')
        .select(`
          id,
          serial_number,
          barcode,
          status,
          purchase_price,
          supplier_id,
          product_id,
          products (
            brand,
            model
          ),
          suppliers (
            id,
            name
          )
        `)
        .or(`serial_number.ilike.%${term}%,barcode.ilike.%${term}%`)
        .order('created_at', { ascending: false }),
      supabase
        .from('sold_product_units')
        .select(`
          product_unit_id,
          serial_number,
          barcode,
          original_purchase_price,
          supplier_name,
          sold_at
        `)
        .or(`serial_number.ilike.%${term}%,barcode.ilike.%${term}%`)
        .order('sold_at', { ascending: false })
    ]);

    if (activeUnitsResult.error) {
      console.error('Error searching active units:', activeUnitsResult.error);
    }

    if (soldUnitsResult.error) {
      console.error('Error searching sold units:', soldUnitsResult.error);
    }

    const units = activeUnitsResult.data || [];
    const soldUnits = soldUnitsResult.data || [];

    // Get product info for sold units
    const soldUnitsWithProducts = await Promise.all(
      soldUnits.map(async (soldUnit) => {
        const { data: unitData } = await supabase
          .from('product_units')
          .select(`
            id,
            product_id,
            supplier_id,
            products (
              brand,
              model
            ),
            suppliers (
              id,
              name
            )
          `)
          .eq('id', soldUnit.product_unit_id)
          .single();

        return {
          id: soldUnit.product_unit_id,
          serial_number: soldUnit.serial_number,
          barcode: soldUnit.barcode,
          status: 'sold',
          purchase_price: soldUnit.original_purchase_price,
          supplier_id: unitData?.supplier_id,
          product_id: unitData?.product_id,
          products: unitData?.products,
          suppliers: unitData?.suppliers,
          sold_at: soldUnit.sold_at
        };
      })
    );

    const allUnits = [...units, ...soldUnitsWithProducts];

    // For each unit, find its transaction
    const unitsWithTransactions = await Promise.all(
      allUnits.map(async (unit) => {
        // Find the transaction that includes this unit
        const { data: transactionItems } = await supabase
          .from('supplier_transaction_items')
          .select(`
            transaction_id,
            supplier_transactions (
              transaction_number,
              transaction_date,
              type
            )
          `)
          .contains('product_unit_ids', [unit.id])
          .limit(1)
          .single();

        return {
          ...unit,
          transaction: transactionItems?.supplier_transactions
        };
      })
    );

    return unitsWithTransactions.map(unit => ({
      type: 'unit' as const,
      id: unit.id,
      unit_id: unit.id,
      serial_number: unit.serial_number,
      barcode: unit.barcode,
      unit_status: unit.status,
      purchase_price: unit.purchase_price,
      product_brand: unit.products?.brand,
      product_model: unit.products?.model,
      supplier_id: unit.supplier_id,
      supplier_name: unit.suppliers?.name,
      transaction_id: unit.transaction?.transaction_number,
      transaction_number: unit.transaction?.transaction_number,
      transaction_date: unit.transaction?.transaction_date
    }));
  }

  /**
   * Get all supplier activity for a specific supplier
   */
  static async getSupplierActivity(supplierId: string): Promise<{
    supplier: any;
    transactions: any[];
    units: any[];
  }> {
    const [supplier, transactions, units] = await Promise.all([
      this.getSupplier(supplierId),
      this.getSupplierTransactions(supplierId),
      this.getSupplierUnits(supplierId)
    ]);

    return { supplier, transactions, units };
  }

  private static async getSupplier(supplierId: string) {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();
    
    return data;
  }

  private static async getSupplierTransactions(supplierId: string) {
    const { data } = await supabase
      .from('supplier_transactions')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('transaction_date', { ascending: false });
    
    return data || [];
  }

  private static async getSupplierUnits(supplierId: string) {
    const { data } = await supabase
      .from('product_units')
      .select(`
        *,
        products (
          brand,
          model
        )
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    return data || [];
  }
}
