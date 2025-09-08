// ============================================
// DATA CONSISTENCY LAYER
// ============================================

import { QueryClient } from '@tanstack/react-query';
import { eventBus } from './EventBus';
import { advancedCacheManager } from './AdvancedCacheManager';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ConsistencyRule {
  id: string;
  name: string;
  entities: string[];
  validationFn: (data: Record<string, any>) => Promise<ConsistencyViolation[]>;
  autoRepair?: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConsistencyViolation {
  ruleId: string;
  entity: string;
  entityId: string;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  suggestedFix?: string;
  autoRepairData?: any;
}

export interface ConsistencyReport {
  id: string;
  timestamp: Date;
  violations: ConsistencyViolation[];
  entitiesChecked: string[];
  status: 'healthy' | 'warnings' | 'errors' | 'critical';
  summary: {
    total: number;
    warnings: number;
    errors: number;
    critical: number;
  };
}

class DataConsistencyLayer {
  private static instance: DataConsistencyLayer;
  private queryClient: QueryClient | null = null;
  private rules: Map<string, ConsistencyRule> = new Map();
  private isInitialized = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): DataConsistencyLayer {
    if (!DataConsistencyLayer.instance) {
      DataConsistencyLayer.instance = new DataConsistencyLayer();
    }
    return DataConsistencyLayer.instance;
  }

  async initialize(queryClient: QueryClient) {
    if (this.isInitialized) return;

    this.queryClient = queryClient;
    this.registerDefaultRules();
    this.setupEventListeners();
    this.startPeriodicChecks();
    
    this.isInitialized = true;
    logger.info('DataConsistencyLayer: Initialized successfully');
  }

  private registerDefaultRules() {
    // Stock consistency rule
    this.registerRule({
      id: 'stock-consistency',
      name: 'Product Stock Consistency',
      entities: ['products', 'product_units', 'sales', 'sale_items'],
      validationFn: this.validateStockConsistency.bind(this),
      autoRepair: true,
      priority: 'high'
    });

    // Serial number uniqueness rule
    this.registerRule({
      id: 'serial-uniqueness',
      name: 'Serial Number Uniqueness',
      entities: ['product_units', 'sale_items'],
      validationFn: this.validateSerialUniqueness.bind(this),
      autoRepair: false,
      priority: 'critical'
    });

    // Price consistency rule
    this.registerRule({
      id: 'price-consistency',
      name: 'Price Range Consistency',
      entities: ['products', 'product_units'],
      validationFn: this.validatePriceConsistency.bind(this),
      autoRepair: false,
      priority: 'medium'
    });

    // Sales data integrity rule
    this.registerRule({
      id: 'sales-integrity',
      name: 'Sales Data Integrity',
      entities: ['sales', 'sale_items', 'clients'],
      validationFn: this.validateSalesIntegrity.bind(this),
      autoRepair: false,
      priority: 'high'
    });
  }

  registerRule(rule: ConsistencyRule) {
    this.rules.set(rule.id, rule);
    logger.info(`DataConsistencyLayer: Registered rule ${rule.id}`);
  }

  private setupEventListeners() {
    // Listen for data changes and trigger consistency checks
    eventBus.on('data:changed', async (event) => {
      const affectedRules = Array.from(this.rules.values())
        .filter(rule => rule.entities.includes(event.module));
      
      for (const rule of affectedRules) {
        if (rule.priority === 'critical' || rule.priority === 'high') {
          await this.checkRule(rule.id);
        }
      }
    });

    // Listen for consistency violations
    eventBus.on('consistency:violation', this.handleViolation.bind(this));
  }

  private startPeriodicChecks() {
    // Run full consistency check every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.runFullConsistencyCheck();
    }, 5 * 60 * 1000);
  }

  async runFullConsistencyCheck(): Promise<ConsistencyReport> {
    const violations: ConsistencyViolation[] = [];
    const entitiesChecked = new Set<string>();

    logger.info('DataConsistencyLayer: Running full consistency check');

    for (const rule of this.rules.values()) {
      try {
        const ruleViolations = await this.checkRule(rule.id);
        violations.push(...ruleViolations);
        rule.entities.forEach(entity => entitiesChecked.add(entity));
      } catch (error) {
        logger.error(`DataConsistencyLayer: Error checking rule ${rule.id}`, error);
      }
    }

    const report = this.generateReport(violations, Array.from(entitiesChecked));
    
    // Emit report event
    await eventBus.emit({
      type: 'consistency:report',
      module: 'inventory',
      operation: 'create',
      entityId: report.id,
      data: report
    });

    return report;
  }

  async checkRule(ruleId: string): Promise<ConsistencyViolation[]> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      logger.warn(`DataConsistencyLayer: Rule ${ruleId} not found`);
      return [];
    }

    try {
      const data = await this.gatherDataForRule(rule);
      const violations = await rule.validationFn(data);
      
      // Auto-repair if enabled
      if (rule.autoRepair && violations.length > 0) {
        await this.attemptAutoRepair(violations);
      }

      return violations;
    } catch (error) {
      logger.error(`DataConsistencyLayer: Error validating rule ${ruleId}`, error);
      return [];
    }
  }

  private async gatherDataForRule(rule: ConsistencyRule): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    for (const entity of rule.entities) {
      try {
        const { data: entityData } = await supabase
          .from(entity)
          .select('*');
        
        data[entity] = entityData || [];
      } catch (error) {
        logger.error(`DataConsistencyLayer: Error fetching ${entity}`, error);
        data[entity] = [];
      }
    }

    return data;
  }

  private async validateStockConsistency(data: Record<string, any>): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = [];
    const products = data.products || [];
    const productUnits = data.product_units || [];

    for (const product of products) {
      if (!product.has_serial) continue;

      const units = productUnits.filter((unit: any) => unit.product_id === product.id);
      const availableUnits = units.filter((unit: any) => unit.status === 'available');
      
      if (product.stock !== availableUnits.length) {
        violations.push({
          ruleId: 'stock-consistency',
          entity: 'products',
          entityId: product.id,
          severity: 'error',
          message: `Product stock (${product.stock}) doesn't match available units (${availableUnits.length})`,
          suggestedFix: `Update stock to ${availableUnits.length}`,
          autoRepairData: { 
            correctStock: availableUnits.length,
            productId: product.id 
          }
        });
      }
    }

    return violations;
  }

  private async validateSerialUniqueness(data: Record<string, any>): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = [];
    const productUnits = data.product_units || [];
    const serialNumbers = new Map<string, string[]>();

    // Check for duplicate serials
    for (const unit of productUnits) {
      if (!unit.serial_number) continue;
      
      const serial = unit.serial_number.trim();
      if (!serialNumbers.has(serial)) {
        serialNumbers.set(serial, []);
      }
      serialNumbers.get(serial)!.push(unit.id);
    }

    for (const [serial, unitIds] of serialNumbers.entries()) {
      if (unitIds.length > 1) {
        violations.push({
          ruleId: 'serial-uniqueness',
          entity: 'product_units',
          entityId: unitIds.join(','),
          severity: 'critical',
          message: `Duplicate serial number found: ${serial} (${unitIds.length} units)`,
          suggestedFix: 'Remove or update duplicate serial numbers'
        });
      }
    }

    return violations;
  }

  private async validatePriceConsistency(data: Record<string, any>): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = [];
    const products = data.products || [];
    const productUnits = data.product_units || [];

    for (const product of products) {
      const units = productUnits.filter((unit: any) => unit.product_id === product.id);
      
      for (const unit of units) {
        if (unit.min_price && unit.min_price <= product.price) {
          violations.push({
            ruleId: 'price-consistency',
            entity: 'product_units',
            entityId: unit.id,
            severity: 'warning',
            message: `Unit min price (${unit.min_price}) should be greater than base price (${product.price})`,
            suggestedFix: `Set min price to at least ${product.price + 1}`
          });
        }

        if (unit.max_price && unit.min_price && unit.max_price <= unit.min_price) {
          violations.push({
            ruleId: 'price-consistency',
            entity: 'product_units',
            entityId: unit.id,
            severity: 'error',
            message: `Unit max price (${unit.max_price}) should be greater than min price (${unit.min_price})`,
            suggestedFix: 'Adjust price ranges to ensure max > min'
          });
        }
      }
    }

    return violations;
  }

  private async validateSalesIntegrity(data: Record<string, any>): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = [];
    const sales = data.sales || [];
    const saleItems = data.sale_items || [];
    const clients = data.clients || [];

    for (const sale of sales) {
      // Check if client exists
      if (sale.client_id) {
        const client = clients.find((c: any) => c.id === sale.client_id);
        if (!client) {
          violations.push({
            ruleId: 'sales-integrity',
            entity: 'sales',
            entityId: sale.id,
            severity: 'error',
            message: `Sale references non-existent client: ${sale.client_id}`,
            suggestedFix: 'Remove client reference or restore client data'
          });
        }
      }

      // Check sale totals
      const items = saleItems.filter((item: any) => item.sale_id === sale.id);
      const calculatedTotal = items.reduce((sum: number, item: any) => sum + item.total_price, 0);
      const expectedTotal = sale.subtotal + sale.tax_amount - sale.discount_amount;

      if (Math.abs(calculatedTotal - expectedTotal) > 0.01) {
        violations.push({
          ruleId: 'sales-integrity',
          entity: 'sales',
          entityId: sale.id,
          severity: 'error',
          message: `Sale total mismatch. Calculated: ${calculatedTotal}, Expected: ${expectedTotal}`,
          suggestedFix: 'Recalculate sale totals'
        });
      }
    }

    return violations;
  }

  private async attemptAutoRepair(violations: ConsistencyViolation[]) {
    for (const violation of violations) {
      if (!violation.autoRepairData) continue;

      try {
        switch (violation.ruleId) {
          case 'stock-consistency':
            await this.repairStockConsistency(violation);
            break;
          default:
            logger.warn(`DataConsistencyLayer: No auto-repair handler for rule ${violation.ruleId}`);
        }
      } catch (error) {
        logger.error(`DataConsistencyLayer: Auto-repair failed for ${violation.ruleId}`, error);
      }
    }
  }

  private async repairStockConsistency(violation: ConsistencyViolation) {
    const { correctStock, productId } = violation.autoRepairData;
    
    await supabase
      .from('products')
      .update({ stock: correctStock })
      .eq('id', productId);

    logger.info(`DataConsistencyLayer: Auto-repaired stock for product ${productId}`);
    
    // Invalidate caches
    if (this.queryClient) {
      await advancedCacheManager.invalidateByPattern(['products', productId]);
    }
  }

  private generateReport(violations: ConsistencyViolation[], entitiesChecked: string[]): ConsistencyReport {
    const summary = {
      total: violations.length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      errors: violations.filter(v => v.severity === 'error').length,
      critical: violations.filter(v => v.severity === 'critical').length
    };

    let status: 'healthy' | 'warnings' | 'errors' | 'critical' = 'healthy';
    if (summary.critical > 0) status = 'critical';
    else if (summary.errors > 0) status = 'errors';
    else if (summary.warnings > 0) status = 'warnings';

    return {
      id: `consistency-${Date.now()}`,
      timestamp: new Date(),
      violations,
      entitiesChecked,
      status,
      summary
    };
  }

  private async handleViolation(violation: ConsistencyViolation) {
    logger.warn(`DataConsistencyLayer: Consistency violation detected`, violation);
    
    // Emit to UI for display
    await eventBus.emit({
      type: 'ui:notification',
      module: 'data_consistency',
      operation: 'violation',
      entityId: violation.entityId,
      data: {
        type: violation.severity === 'critical' ? 'error' : 'warning',
        message: violation.message
      }
    });
  }

  getViolationsByEntity(entityType: string): ConsistencyViolation[] {
    // This would be implemented to return cached violations
    return [];
  }

  async repairViolation(violationId: string): Promise<boolean> {
    // Implementation for manual violation repair
    return false;
  }

  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isInitialized = false;
  }
}

export const dataConsistencyLayer = DataConsistencyLayer.getInstance();