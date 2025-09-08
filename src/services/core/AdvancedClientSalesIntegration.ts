import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { eventBus, EVENT_TYPES } from './EventBus';
import { transactionCoordinator } from './TransactionCoordinator';
import type { CreateSaleData } from '../sales/types';
import type { CreateClientData, Client } from '../clients/types';

/**
 * Advanced client-sales integration with transaction coordination
 */
export class AdvancedClientSalesIntegration {
  
  /**
   * Create sale with comprehensive client validation and transaction coordination
   */
  static async createSaleWithClientValidation(
    saleData: CreateSaleData,
    clientData?: Partial<CreateClientData>
  ): Promise<{ sale: any; client?: any; transactionId: string }> {
    const transactionId = await transactionCoordinator.beginTransaction({
      operation: 'create_sale_with_client',
      saleData,
      clientData
    });

    try {
      let client: any = null;
      
      // Step 1: Validate or create client if needed
      if (clientData && !saleData.client_id) {
        client = await transactionCoordinator.executeInTransaction(
          transactionId,
          'create_client',
          'clients',
          async () => {
            // Validate client data
            await this.validateClientData(clientData);
            
            // Create client
            const { data: newClient, error } = await supabase
              .from('clients')
              .insert(clientData as any)
              .select()
              .single();
              
            if (error) throw error;
            
            // Emit client created event
            await eventBus.emit({
              type: EVENT_TYPES.CLIENT_CREATED,
              module: 'clients',
              operation: 'create',
              entityId: newClient.id,
              data: clientData
            });
            
            return newClient;
          },
          async () => {
            // Compensation: delete created client
            if (client) {
              await supabase.from('clients').delete().eq('id', client.id);
              logger.info('Compensated: Deleted client', { clientId: client.id });
            }
          }
        );
        
        // Update sale data with new client ID
        saleData.client_id = client.id;
      }
      
      // Step 2: Validate client access and permissions
      if (saleData.client_id) {
        await transactionCoordinator.executeInTransaction(
          transactionId,
          'validate_client_access',
          'clients',
          async () => {
            await this.validateClientAccess(saleData.client_id!);
            await this.validateClientSalePermissions(saleData.client_id!, saleData);
          }
        );
      }
      
      // Step 3: Create the sale (this will be handled by the sales service)
      // The transaction will be passed to the sales service for coordination
      
      return { sale: null, client, transactionId };
      
    } catch (error) {
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      throw error;
    }
  }

  /**
   * Update client with sales impact analysis
   */
  static async updateClientWithSalesImpact(
    clientId: string, 
    updateData: Partial<CreateClientData>
  ): Promise<void> {
    const transactionId = await transactionCoordinator.beginTransaction({
      operation: 'update_client_with_sales_impact',
      clientId,
      updateData
    });

    try {
      // Get existing client data for compensation
      const { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      // Step 1: Analyze impact on existing sales
      const salesImpact = await transactionCoordinator.executeInTransaction(
        transactionId,
        'analyze_sales_impact',
        'sales',
        async () => {
          return await this.analyzeSalesImpact(clientId, updateData);
        }
      );

      // Step 2: Update client
      await transactionCoordinator.executeInTransaction(
        transactionId,
        'update_client',
        'clients',
        async () => {
          const { error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', clientId);
            
          if (error) throw error;
          
          // Emit client updated event
          await eventBus.emit({
            type: EVENT_TYPES.CLIENT_UPDATED,
            module: 'clients',
            operation: 'update',
            entityId: clientId,
            data: updateData
          });
        },
        async () => {
          // Compensation: restore original client data
          if (existingClient) {
            await supabase
              .from('clients')
              .update(existingClient)
              .eq('id', clientId);
            logger.info('Compensated: Restored client data', { clientId });
          }
        }
      );

      // Step 3: Update affected sales if needed
      if (salesImpact.affectedSales.length > 0) {
        await transactionCoordinator.executeInTransaction(
          transactionId,
          'update_affected_sales',
          'sales',
          async () => {
            for (const saleUpdate of salesImpact.salesUpdates) {
              await this.updateSaleForClientChange(saleUpdate.saleId, saleUpdate.changes);
            }
          }
        );
      }

      await transactionCoordinator.commitTransaction(transactionId);
      
    } catch (error) {
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      throw error;
    }
  }

  /**
   * Get client sales analytics with caching
   */
  static async getClientSalesAnalytics(clientId: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastPurchaseDate: string | null;
    purchaseFrequency: number;
    topProducts: Array<{ productId: string; quantity: number; revenue: number }>;
    salesTrend: Array<{ period: string; sales: number; revenue: number }>;
  }> {
    try {
      // Get sales data
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          sale_date,
          sale_items (
            product_id,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('client_id', clientId)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const salesList = sales || [];
      
      // Calculate analytics
      const totalSales = salesList.length;
      const totalRevenue = salesList.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      const lastPurchaseDate = salesList.length > 0 ? salesList[0].sale_date : null;
      
      // Calculate purchase frequency (purchases per month)
      const firstPurchase = salesList.length > 0 ? salesList[salesList.length - 1].sale_date : null;
      let purchaseFrequency = 0;
      
      if (firstPurchase) {
        const monthsDiff = (Date.now() - new Date(firstPurchase).getTime()) / (1000 * 60 * 60 * 24 * 30);
        purchaseFrequency = monthsDiff > 0 ? totalSales / monthsDiff : 0;
      }

      // Calculate top products
      const productStats = new Map<string, { quantity: number; revenue: number }>();
      
      salesList.forEach(sale => {
        (sale.sale_items as any[])?.forEach(item => {
          const current = productStats.get(item.product_id) || { quantity: 0, revenue: 0 };
          productStats.set(item.product_id, {
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + Number(item.total_price)
          });
        });
      });

      const topProducts = Array.from(productStats.entries())
        .map(([productId, stats]) => ({ productId, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate sales trend (last 12 months)
      const salesTrend = this.calculateSalesTrend(salesList);

      return {
        totalSales,
        totalRevenue,
        averageOrderValue,
        lastPurchaseDate,
        purchaseFrequency,
        topProducts,
        salesTrend
      };

    } catch (error) {
      logger.error('AdvancedClientSalesIntegration: Error getting client analytics', error);
      throw error;
    }
  }

  /**
   * Validate client data comprehensively
   */
  private static async validateClientData(clientData: Partial<CreateClientData>): Promise<void> {
    const errors: string[] = [];

    // Basic validation
    if (!clientData.first_name && !clientData.company_name) {
      errors.push('Client must have either first name or company name');
    }

    // Email validation
    if (clientData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientData.email)) {
        errors.push('Invalid email format');
      }

      // Check for duplicate email
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', clientData.email)
        .single();

      if (existingClient) {
        errors.push('Client with this email already exists');
      }
    }

    // Phone validation
    if (clientData.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(clientData.phone.replace(/\s/g, ''))) {
        errors.push('Invalid phone number format');
      }
    }

    // Tax ID validation for business clients
    if (clientData.type === 'business' && clientData.tax_id) {
      // Check for duplicate tax ID
      const { data: existingBusiness } = await supabase
        .from('clients')
        .select('id')
        .eq('tax_id', clientData.tax_id)
        .single();

      if (existingBusiness) {
        errors.push('Business with this tax ID already exists');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  /**
   * Validate client access permissions
   */
  private static async validateClientAccess(clientId: string): Promise<void> {
    const { data: client, error } = await supabase
      .from('clients')
      .select('status')
      .eq('id', clientId)
      .single();

    if (error) {
      throw new Error(`Client not found: ${clientId}`);
    }

    if (client.status !== 'active') {
      throw new Error(`Client is not active (status: ${client.status})`);
    }
  }

  /**
   * Validate client-specific sale permissions
   */
  private static async validateClientSalePermissions(
    clientId: string, 
    saleData: CreateSaleData
  ): Promise<void> {
    // Get client type and any restrictions
    const { data: client } = await supabase
      .from('clients')
      .select('type, notes')
      .eq('id', clientId)
      .single();

    if (!client) {
      throw new Error('Client not found for sale validation');
    }

    // Business logic validations could go here
    // For example: credit limits, restricted products, etc.
    
    // Check if client has any sales restrictions in notes
    if (client.notes && client.notes.toLowerCase().includes('restricted')) {
      throw new Error('Client has sales restrictions');
    }
  }

  /**
   * Analyze impact of client changes on existing sales
   */
  private static async analyzeSalesImpact(
    clientId: string, 
    updateData: Partial<CreateClientData>
  ): Promise<{
    affectedSales: string[];
    salesUpdates: Array<{ saleId: string; changes: any }>;
  }> {
    // Get client's sales
    const { data: sales } = await supabase
      .from('sales')
      .select('id, status')
      .eq('client_id', clientId);

    const affectedSales = (sales || []).map(sale => sale.id);
    const salesUpdates: Array<{ saleId: string; changes: any }> = [];

    // Determine if any sales need updates based on client changes
    // For example, if client type changes, tax calculations might need update
    if (updateData.type) {
      for (const sale of sales || []) {
        if (sale.status === 'pending') {
          salesUpdates.push({
            saleId: sale.id,
            changes: { needs_recalculation: true }
          });
        }
      }
    }

    return { affectedSales, salesUpdates };
  }

  /**
   * Update sale for client changes
   */
  private static async updateSaleForClientChange(saleId: string, changes: any): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .update(changes)
      .eq('id', saleId);

    if (error) {
      throw new Error(`Failed to update sale ${saleId}: ${error.message}`);
    }

    // Emit sale updated event
    await eventBus.emit({
      type: EVENT_TYPES.SALE_UPDATED,
      module: 'sales',
      operation: 'update',
      entityId: saleId,
      data: { reason: 'client_updated', changes }
    });
  }

  /**
   * Calculate sales trend data
   */
  private static calculateSalesTrend(sales: any[]): Array<{ period: string; sales: number; revenue: number }> {
    const now = new Date();
    const trends: Array<{ period: string; sales: number; revenue: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const periodSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= periodStart && saleDate <= periodEnd;
      });

      trends.push({
        period: periodStart.toISOString().slice(0, 7), // YYYY-MM format
        sales: periodSales.length,
        revenue: periodSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
      });
    }

    return trends;
  }
}