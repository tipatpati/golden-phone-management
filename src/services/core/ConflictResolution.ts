// ============================================
// CONFLICT RESOLUTION SERVICE
// ============================================

import { QueryClient } from '@tanstack/react-query';
import { eventBus } from './EventBus';
import { logger } from '@/utils/logger';

export interface DataConflict {
  id: string;
  entity: string;
  entityId: string;
  conflictType: 'version' | 'constraint' | 'dependency' | 'business_rule';
  local: any;
  remote: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolutionStrategy?: ConflictResolutionStrategy;
}

export interface ConflictResolutionStrategy {
  id: string;
  name: string;
  description: string;
  autoApply: boolean;
  resolveFn: (conflict: DataConflict) => Promise<any>;
}

export interface ConflictResolutionResult {
  success: boolean;
  resolvedData?: any;
  error?: string;
  appliedStrategy: string;
}

class ConflictResolution {
  private static instance: ConflictResolution;
  private queryClient: QueryClient | null = null;
  private strategies: Map<string, ConflictResolutionStrategy> = new Map();
  private conflictQueue: DataConflict[] = [];

  private constructor() {}

  static getInstance(): ConflictResolution {
    if (!ConflictResolution.instance) {
      ConflictResolution.instance = new ConflictResolution();
    }
    return ConflictResolution.instance;
  }

  async initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.registerDefaultStrategies();
    this.setupEventListeners();
    logger.info('ConflictResolution: Initialized successfully');
  }

  private registerDefaultStrategies() {
    // Latest wins strategy
    this.registerStrategy({
      id: 'latest-wins',
      name: 'Latest Wins',
      description: 'Use the most recently modified version',
      autoApply: true,
      resolveFn: this.latestWinsStrategy.bind(this)
    });

    // Merge strategy
    this.registerStrategy({
      id: 'merge',
      name: 'Smart Merge',
      description: 'Merge non-conflicting fields intelligently',
      autoApply: false,
      resolveFn: this.mergeStrategy.bind(this)
    });

    // Business priority strategy
    this.registerStrategy({
      id: 'business-priority',
      name: 'Business Priority',
      description: 'Resolve based on business rules and priorities',
      autoApply: false,
      resolveFn: this.businessPriorityStrategy.bind(this)
    });

    // User decision strategy
    this.registerStrategy({
      id: 'user-decision',
      name: 'User Decision',
      description: 'Require manual user intervention',
      autoApply: false,
      resolveFn: this.userDecisionStrategy.bind(this)
    });
  }

  registerStrategy(strategy: ConflictResolutionStrategy) {
    this.strategies.set(strategy.id, strategy);
    logger.info(`ConflictResolution: Registered strategy ${strategy.id}`);
  }

  private setupEventListeners() {
    eventBus.on('data:conflict', this.handleConflict.bind(this));
  }

  async detectConflict(
    entity: string,
    entityId: string,
    local: any,
    remote: any
  ): Promise<DataConflict | null> {
    // Compare versions if available
    if (local.updated_at && remote.updated_at) {
      const localTime = new Date(local.updated_at);
      const remoteTime = new Date(remote.updated_at);
      
      if (localTime.getTime() !== remoteTime.getTime()) {
        return {
          id: `conflict-${entity}-${entityId}-${Date.now()}`,
          entity,
          entityId,
          conflictType: 'version',
          local,
          remote,
          timestamp: new Date(),
          severity: this.calculateConflictSeverity(entity, local, remote)
        };
      }
    }

    // Check for business rule conflicts
    const businessConflict = await this.checkBusinessRuleConflicts(entity, local, remote);
    if (businessConflict) {
      return {
        id: `conflict-${entity}-${entityId}-${Date.now()}`,
        entity,
        entityId,
        conflictType: 'business_rule',
        local,
        remote,
        timestamp: new Date(),
        severity: 'high'
      };
    }

    return null;
  }

  private calculateConflictSeverity(entity: string, local: any, remote: any): 'low' | 'medium' | 'high' | 'critical' {
    const criticalFields = {
      products: ['price', 'stock'],
      sales: ['total_amount', 'status'],
      clients: ['type', 'status'],
      product_units: ['status', 'serial_number']
    };

    const entityCriticalFields = criticalFields[entity as keyof typeof criticalFields] || [];
    
    for (const field of entityCriticalFields) {
      if (local[field] !== remote[field]) {
        return 'critical';
      }
    }

    // Count changed fields
    const changedFields = Object.keys(local).filter(key => local[key] !== remote[key]);
    if (changedFields.length > 5) return 'high';
    if (changedFields.length > 2) return 'medium';
    return 'low';
  }

  private async checkBusinessRuleConflicts(entity: string, local: any, remote: any): Promise<boolean> {
    switch (entity) {
      case 'products':
        return this.checkProductBusinessRules(local, remote);
      case 'sales':
        return this.checkSalesBusinessRules(local, remote);
      case 'product_units':
        return this.checkProductUnitBusinessRules(local, remote);
      default:
        return false;
    }
  }

  private checkProductBusinessRules(local: any, remote: any): boolean {
    // Check price consistency
    if (local.min_price > local.max_price || remote.min_price > remote.max_price) {
      return true;
    }

    // Check stock validity
    if ((local.stock < 0 && remote.stock >= 0) || (remote.stock < 0 && local.stock >= 0)) {
      return true;
    }

    return false;
  }

  private checkSalesBusinessRules(local: any, remote: any): boolean {
    // Check status transitions
    const invalidTransitions = [
      { from: 'cancelled', to: 'completed' },
      { from: 'refunded', to: 'completed' }
    ];

    for (const transition of invalidTransitions) {
      if (local.status === transition.from && remote.status === transition.to) {
        return true;
      }
    }

    return false;
  }

  private checkProductUnitBusinessRules(local: any, remote: any): boolean {
    // Check status transitions
    if (local.status === 'sold' && remote.status === 'available') {
      return true; // Can't unsell a unit without proper process
    }

    return false;
  }

  async handleConflict(conflict: DataConflict): Promise<ConflictResolutionResult> {
    logger.info(`ConflictResolution: Handling conflict for ${conflict.entity}:${conflict.entityId}`);

    // Add to queue
    this.conflictQueue.push(conflict);

    // Determine resolution strategy
    const strategy = this.selectResolutionStrategy(conflict);
    conflict.resolutionStrategy = strategy;

    if (strategy.autoApply) {
      return await this.resolveConflict(conflict);
    } else {
      // Emit event for manual resolution
      await eventBus.emit({
        type: 'conflict:manual_resolution_required',
        module: 'conflict_resolution',
        operation: 'resolve',
        entityId: conflict.entityId,
        data: conflict
      });

      return {
        success: false,
        error: 'Manual resolution required',
        appliedStrategy: strategy.id
      };
    }
  }

  private selectResolutionStrategy(conflict: DataConflict): ConflictResolutionStrategy {
    // Select strategy based on conflict type and severity
    if (conflict.severity === 'critical') {
      return this.strategies.get('user-decision')!;
    }

    if (conflict.conflictType === 'business_rule') {
      return this.strategies.get('business-priority')!;
    }

    if (conflict.severity === 'low') {
      return this.strategies.get('latest-wins')!;
    }

    return this.strategies.get('merge')!;
  }

  async resolveConflict(conflict: DataConflict): Promise<ConflictResolutionResult> {
    const strategy = conflict.resolutionStrategy || this.strategies.get('latest-wins')!;

    try {
      const resolvedData = await strategy.resolveFn(conflict);
      
      // Emit resolution event
      await eventBus.emit({
        type: 'conflict:resolved',
        module: 'conflict_resolution',
        operation: 'resolve',
        entityId: conflict.entityId,
        data: { conflict, resolvedData, strategy: strategy.id }
      });

      // Remove from queue
      this.conflictQueue = this.conflictQueue.filter(c => c.id !== conflict.id);

      return {
        success: true,
        resolvedData,
        appliedStrategy: strategy.id
      };
    } catch (error) {
      logger.error(`ConflictResolution: Failed to resolve conflict ${conflict.id}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        appliedStrategy: strategy.id
      };
    }
  }

  // Resolution strategy implementations
  private async latestWinsStrategy(conflict: DataConflict): Promise<any> {
    const localTime = new Date(conflict.local.updated_at || 0);
    const remoteTime = new Date(conflict.remote.updated_at || 0);
    
    return localTime > remoteTime ? conflict.local : conflict.remote;
  }

  private async mergeStrategy(conflict: DataConflict): Promise<any> {
    const merged = { ...conflict.remote }; // Start with remote
    
    // Merge non-conflicting fields from local
    Object.keys(conflict.local).forEach(key => {
      if (key === 'updated_at' || key === 'created_at') return;
      
      // Use local value if remote doesn't have it or if it's newer
      if (!conflict.remote[key] || 
          (conflict.local.updated_at && conflict.remote.updated_at && 
           new Date(conflict.local.updated_at) > new Date(conflict.remote.updated_at))) {
        merged[key] = conflict.local[key];
      }
    });

    return merged;
  }

  private async businessPriorityStrategy(conflict: DataConflict): Promise<any> {
    // Apply business-specific resolution rules
    switch (conflict.entity) {
      case 'products':
        return this.resolveProductConflict(conflict);
      case 'sales':
        return this.resolveSalesConflict(conflict);
      default:
        return this.latestWinsStrategy(conflict);
    }
  }

  private async userDecisionStrategy(conflict: DataConflict): Promise<any> {
    // This would typically wait for user input through UI
    // For now, return the conflict for manual handling
    throw new Error('User decision required - conflict needs manual resolution');
  }

  private resolveProductConflict(conflict: DataConflict): any {
    const resolved = { ...conflict.local };
    
    // Preserve critical business data from remote if valid
    if (conflict.remote.stock >= 0) {
      resolved.stock = conflict.remote.stock;
    }
    
    // Use higher price if both are valid
    if (conflict.remote.price > 0 && conflict.local.price > 0) {
      resolved.price = Math.max(conflict.local.price, conflict.remote.price);
    }

    return resolved;
  }

  private resolveSalesConflict(conflict: DataConflict): any {
    const resolved = { ...conflict.local };
    
    // Preserve completed sales status
    if (conflict.remote.status === 'completed' && conflict.local.status !== 'cancelled') {
      resolved.status = 'completed';
    }
    
    return resolved;
  }

  getPendingConflicts(): DataConflict[] {
    return [...this.conflictQueue];
  }

  async resolveManualConflict(conflictId: string, resolution: any): Promise<ConflictResolutionResult> {
    const conflict = this.conflictQueue.find(c => c.id === conflictId);
    if (!conflict) {
      return {
        success: false,
        error: 'Conflict not found',
        appliedStrategy: 'unknown'
      };
    }

    // Apply manual resolution
    await eventBus.emit({
      type: 'conflict:resolved',
      module: 'conflict_resolution',
      operation: 'resolve',
      entityId: conflict.entityId,
      data: { conflict, resolvedData: resolution, strategy: 'manual' }
    });

    // Remove from queue
    this.conflictQueue = this.conflictQueue.filter(c => c.id !== conflictId);

    return {
      success: true,
      resolvedData: resolution,
      appliedStrategy: 'manual'
    };
  }
}

export const conflictResolution = ConflictResolution.getInstance();