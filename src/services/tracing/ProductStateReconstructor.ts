import { ProductTraceResult } from './types';

export interface ProductState {
  timestamp: string;
  status: string;
  condition: string;
  location: 'supplier' | 'inventory' | 'customer';
  owner?: string;
  price?: number;
  specs: {
    color?: string;
    storage?: number;
    ram?: number;
    battery_level?: number;
  };
  metadata: any;
}

export interface TimelinePoint {
  timestamp: string;
  eventType: 'acquisition' | 'modification' | 'sale';
  state: ProductState;
  changes?: Record<string, { from: any; to: any }>;
  eventData: any;
}

export class ProductStateReconstructor {
  /**
   * Reconstruct all states throughout the product's lifecycle
   */
  static reconstructTimeline(traceResult: ProductTraceResult): TimelinePoint[] {
    const timeline: TimelinePoint[] = [];

    // Initial state from acquisition
    if (traceResult.acquisitionHistory) {
      const acquisitionState: ProductState = {
        timestamp: traceResult.acquisitionHistory.transaction_date || traceResult.unitDetails.created_at,
        status: 'available',
        condition: traceResult.unitDetails.condition,
        location: 'inventory',
        owner: traceResult.acquisitionHistory.supplier_name,
        price: traceResult.acquisitionHistory.unit_cost,
        specs: {
          color: traceResult.unitDetails.color,
          storage: traceResult.unitDetails.storage,
          ram: traceResult.unitDetails.ram,
          battery_level: traceResult.unitDetails.battery_level,
        },
        metadata: {
          transaction_number: traceResult.acquisitionHistory.transaction_number,
          supplier_id: traceResult.acquisitionHistory.supplier_id,
        },
      };

      timeline.push({
        timestamp: acquisitionState.timestamp,
        eventType: 'acquisition',
        state: acquisitionState,
        eventData: traceResult.acquisitionHistory,
      });
    }

    // Add modification states
    let currentState = timeline[timeline.length - 1]?.state || this.createDefaultState(traceResult);
    
    traceResult.modificationHistory.forEach((modification) => {
      const changes: Record<string, { from: any; to: any }> = {};
      
      // Calculate what changed
      if (modification.old_data && modification.new_data) {
        Object.keys(modification.new_data).forEach(key => {
          if (modification.old_data[key] !== modification.new_data[key]) {
            changes[key] = {
              from: modification.old_data[key],
              to: modification.new_data[key],
            };
          }
        });
      }

      // Apply changes to create new state
      const newState: ProductState = {
        ...currentState,
        timestamp: modification.changed_at,
        status: modification.new_data?.status || currentState.status,
        condition: modification.new_data?.condition || currentState.condition,
        specs: {
          ...currentState.specs,
          color: modification.new_data?.color || currentState.specs.color,
          storage: modification.new_data?.storage || currentState.specs.storage,
          ram: modification.new_data?.ram || currentState.specs.ram,
          battery_level: modification.new_data?.battery_level || currentState.specs.battery_level,
        },
        metadata: {
          ...currentState.metadata,
          modification_note: modification.note,
          changed_by: modification.changed_by,
        },
      };

      timeline.push({
        timestamp: modification.changed_at,
        eventType: 'modification',
        state: newState,
        changes,
        eventData: modification,
      });

      currentState = newState;
    });

    // Add sale state if sold
    if (traceResult.saleInfo) {
      const saleState: ProductState = {
        ...currentState,
        timestamp: traceResult.saleInfo.sold_at,
        status: 'sold',
        location: 'customer',
        owner: traceResult.saleInfo.customer_name,
        price: traceResult.saleInfo.sold_price,
        metadata: {
          ...currentState.metadata,
          sale_number: traceResult.saleInfo.sale_number,
          sale_id: traceResult.saleInfo.sale_id,
          payment_method: traceResult.saleInfo.payment_method,
          salesperson: traceResult.saleInfo.salesperson_name,
        },
      };

      const saleChanges: Record<string, { from: any; to: any }> = {
        status: { from: currentState.status, to: 'sold' },
        location: { from: currentState.location, to: 'customer' },
        owner: { from: currentState.owner, to: traceResult.saleInfo.customer_name },
        price: { from: currentState.price, to: traceResult.saleInfo.sold_price },
      };

      timeline.push({
        timestamp: traceResult.saleInfo.sold_at,
        eventType: 'sale',
        state: saleState,
        changes: saleChanges,
        eventData: traceResult.saleInfo,
      });
    }

    return timeline;
  }

  /**
   * Get product state at a specific timestamp
   */
  static getStateAtTime(timeline: TimelinePoint[], timestamp: string): ProductState | null {
    const targetTime = new Date(timestamp).getTime();
    
    // Find the latest state before or at the target time
    const applicableStates = timeline.filter(
      point => new Date(point.timestamp).getTime() <= targetTime
    );

    if (applicableStates.length === 0) return null;

    return applicableStates[applicableStates.length - 1].state;
  }

  /**
   * Compare states at two different times
   */
  static compareStates(state1: ProductState, state2: ProductState): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    // Compare top-level fields
    (['status', 'condition', 'location', 'owner', 'price'] as const).forEach(key => {
      if (state1[key] !== state2[key]) {
        changes[key] = { from: state1[key], to: state2[key] };
      }
    });

    // Compare specs
    Object.keys(state2.specs).forEach(key => {
      if (state1.specs[key as keyof typeof state1.specs] !== state2.specs[key as keyof typeof state2.specs]) {
        changes[`specs.${key}`] = {
          from: state1.specs[key as keyof typeof state1.specs],
          to: state2.specs[key as keyof typeof state2.specs],
        };
      }
    });

    return changes;
  }

  /**
   * Create a default initial state
   */
  private static createDefaultState(traceResult: ProductTraceResult): ProductState {
    return {
      timestamp: traceResult.unitDetails.created_at,
      status: traceResult.unitDetails.status,
      condition: traceResult.unitDetails.condition,
      location: 'inventory',
      specs: {
        color: traceResult.unitDetails.color,
        storage: traceResult.unitDetails.storage,
        ram: traceResult.unitDetails.ram,
        battery_level: traceResult.unitDetails.battery_level,
      },
      metadata: {},
    };
  }
}
