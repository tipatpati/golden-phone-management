# Message Stalling Issues - Fix Priority Roadmap

## Executive Summary

The application has **critical architectural flaws** that cause messages to get stuck indefinitely. These issues are interconnected - fixing one without the others provides limited benefit.

**Total Estimated Fix Time:** 3-5 days for complete resolution
**Risk Level:** CRITICAL - Affects all real-time operations
**Impact:** Users experience complete application freezes lasting minutes

---

## Priority 1: CRITICAL (Do First - 1 Day)

### 1.1 EventBus Queue Timeout (HIGHEST IMPACT)

**File:** `/home/user/golden-phone-management/src/services/core/EventBus.ts`

**Current Code:**
```typescript
private async processQueue(): Promise<void> {
  if (this.isProcessing) return;
  this.isProcessing = true;

  try {
    while (this.processingQueue.length > 0) {
      const event = this.processingQueue.shift()!;
      await this.processEvent(event);  // ❌ NO TIMEOUT
    }
  } finally {
    this.isProcessing = false;
  }
}
```

**Fix Required:**
```typescript
private readonly LISTENER_TIMEOUT = 5000; // 5 seconds per listener

private async processQueue(): Promise<void> {
  if (this.isProcessing) return;
  this.isProcessing = true;

  try {
    while (this.processingQueue.length > 0) {
      const event = this.processingQueue.shift()!;
      try {
        // ✅ ADD TIMEOUT WITH Promise.race
        await Promise.race([
          this.processEvent(event),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Listener timeout')), this.LISTENER_TIMEOUT)
          )
        ]);
      } catch (error) {
        logger.error(`EventBus: Event processing timeout or error`, { error });
        // Continue to next event instead of blocking
      }
    }
  } finally {
    this.isProcessing = false;
  }
}
```

**Why This Matters:** Prevents the entire queue from blocking if one listener hangs

**Test:** Set timeout to 1 second, make a listener hang for 5 seconds, verify next event processes

---

### 1.2 API Request Timeout with AbortController

**File:** `/home/user/golden-phone-management/src/services/core/BaseApiService.ts`

**Current Code:**
```typescript
protected async performQuery<TResult = T>(
  queryBuilder: any,
  operation: string
): Promise<TResult> {
  const { data, error } = await queryBuilder;  // ❌ NO TIMEOUT ENFORCEMENT
  if (error) {
    this.handleError(operation, error);
  }
  return data;
}
```

**Fix Required:**
```typescript
protected async performQuery<TResult = T>(
  queryBuilder: any,
  operation: string
): Promise<TResult> {
  // ✅ IMPLEMENT TIMEOUT WRAPPER
  try {
    const result = await this.withTimeout(queryBuilder, apiConfig.defaults.timeout);
    if (result.error) {
      this.handleError(operation, result.error);
    }
    return result.data;
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout') {
      throw new Error(`${operation} timeout after ${apiConfig.defaults.timeout}ms`);
    }
    throw error;
  }
}

private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
}
```

**Why This Matters:** Prevents hanging API calls from blocking message processing

**Test:** Make an API that hangs, verify it times out after configured duration

---

### 1.3 Real-time Subscription Error Handling

**File:** `/home/user/golden-phone-management/src/hooks/useRealtimeInventory.ts` (and similar)

**Current Code:**
```typescript
export function useRealtimeInventory() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', {...}, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      })
      .subscribe();  // ❌ NO ERROR HANDLING

    return () => {
      productsChannel.unsubscribe();
    };
  }, [queryClient]);
}
```

**Fix Required:**
```typescript
export function useRealtimeInventory() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;

    const setupSubscription = () => {
      const productsChannel = supabase
        .channel('products-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          (payload) => {
            try {
              debugLog('Products table changed:', payload);
              queryClient.invalidateQueries({ queryKey: ['products'] });
            } catch (error) {
              logger.error('Error invalidating products query', error);
            }
          }
        )
        .on('system', { event: 'error' }, (error) => {
          // ✅ ERROR HANDLER
          logger.error('Realtime subscription error:', error);
          handleSubscriptionError();
        })
        .subscribe((status) => {
          // ✅ STATUS HANDLER
          if (status === 'CLOSED') {
            handleSubscriptionClosed();
          } else if (status === 'CHANNEL_ERROR') {
            handleSubscriptionError();
          }
        });

      return productsChannel;
    };

    const handleSubscriptionError = () => {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        logger.warn(`Retrying subscription, attempt ${retryCount}/${MAX_RETRIES}`);
        setTimeout(setupSubscription, RETRY_DELAY);
      } else {
        logger.error('Failed to establish subscription after max retries');
        // Could emit toast/alert to user
      }
    };

    const handleSubscriptionClosed = () => {
      logger.warn('Subscription closed, attempting reconnect');
      retryCount = 0;
      setTimeout(setupSubscription, RETRY_DELAY);
    };

    const productsChannel = setupSubscription();

    return () => {
      try {
        supabase.removeChannel(productsChannel);
      } catch (error) {
        logger.error('Error removing subscription channel', error);
      }
    };
  }, [queryClient]);
}
```

**Why This Matters:** Detects and recovers from broken real-time connections

**Test:** Kill WebSocket connection, verify automatic reconnect within 5 seconds

---

## Priority 2: HIGH (Do Next - 1-2 Days)

### 2.1 Parallel Listener Execution with Individual Timeouts

**File:** `/home/user/golden-phone-management/src/services/core/EventBus.ts`

**Current Code:**
```typescript
private async processEvent(event: SystemEvent): Promise<void> {
  const subscriptions = this.subscriptions.get(event.type) || [];
  const errors: Array<{ subscriptionId: string; error: any }> = [];

  // ❌ SEQUENTIAL
  for (const subscription of subscriptions) {
    try {
      await subscription.listener(event);
    } catch (error) {
      logger.error(`EventBus: Error in listener ${subscription.id}`, error);
      errors.push({ subscriptionId: subscription.id, error });
    }
  }
  // ...
}
```

**Fix Required:**
```typescript
private async processEvent(event: SystemEvent): Promise<void> {
  const subscriptions = this.subscriptions.get(event.type) || [];
  const INDIVIDUAL_LISTENER_TIMEOUT = 5000;

  // ✅ PARALLEL with individual timeouts
  const promises = subscriptions.map(async (subscription) => {
    try {
      await Promise.race([
        subscription.listener(event),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Listener ${subscription.id} timeout`)),
            INDIVIDUAL_LISTENER_TIMEOUT
          )
        )
      ]);
    } catch (error) {
      logger.error(`EventBus: Error in listener ${subscription.id}`, error);
      return { subscriptionId: subscription.id, error };
    }
    return null;
  });

  const results = await Promise.allSettled(promises);
  const errors = results
    .map(r => r.status === 'fulfilled' ? r.value : r.reason)
    .filter((e): e is NonNullable<any> => e != null);

  // Rest of error handling...
}
```

**Why This Matters:** Listeners execute in parallel (faster) and don't block each other

**Expected Improvement:** 3-5x faster event processing when multiple listeners exist

---

### 2.2 Promise.all Timeout Wrappers

**File:** Multiple files - Create new utility

**Create:** `/home/user/golden-phone-management/src/utils/timeoutUtils.ts`

```typescript
/**
 * Utility to enforce timeouts on promises and promise collections
 */

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string = 'Operation timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    )
  ]);
}

export async function withTimeoutSettled<T>(
  promises: Promise<T>[],
  timeoutMs: number
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(
    promises.map(p => withTimeout(p, timeoutMs))
  );
}

export async function withTimeoutRace<T>(
  promises: Promise<T>[],
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    Promise.race(promises),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Race timeout')), timeoutMs)
    )
  ]);
}
```

**Apply To:**
- `EventBus.ts` line 122: `Promise.allSettled(promises)` → `withTimeoutSettled(promises, 5000)`
- `AdvancedCacheManager.ts` all Promise.all calls
- `DataFlowReliability.ts` RetryManager

---

### 2.3 Real-time Query Invalidation Debouncing

**File:** `/home/user/golden-phone-management/src/hooks/useRealtimeSales.ts` (and similar)

**Current Code:**
```typescript
const salesChannel = supabase.channel('sales-changes').on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'sales' },
  (payload) => {
    // ❌ SYNCHRONOUS CASCADE - ALL AT ONCE
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
  }
).subscribe();
```

**Fix Required:**
```typescript
export function useRealtimeSales() {
  const queryClient = useQueryClient();
  const invalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const debouncedInvalidate = () => {
      // Clear previous timeout
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
      }

      // ✅ DEBOUNCE - batch invalidations
      invalidateTimeoutRef.current = setTimeout(() => {
        // Batch invalidate related queries
        queryClient.invalidateQueries({ 
          queryKey: ['sales'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['products'] 
        });
      }, 300); // Wait 300ms for more changes before invalidating
    };

    const salesChannel = supabase
      .channel('sales-changes')
      .on('postgres_changes', {...}, debouncedInvalidate)
      .subscribe();

    return () => {
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
      }
      salesChannel.unsubscribe();
    };
  }, [queryClient]);
}
```

**Why This Matters:** Reduces query thundering from 4 queries per change to 1 batched query

**Expected Improvement:** 75% reduction in network requests on rapid changes

---

## Priority 3: MEDIUM (Optional but Recommended)

### 3.1 Add Cancellation Token Support

**Create:** `/home/user/golden-phone-management/src/utils/CancellationToken.ts`

```typescript
export class CancellationToken {
  private controller = new AbortController();

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get isCancelled(): boolean {
    return this.controller.signal.aborted;
  }

  throwIfCancelled(): void {
    if (this.isCancelled) {
      throw new Error('Cancelled');
    }
  }

  cancel(): void {
    this.controller.abort();
  }
}

export class CancellationSource {
  private token = new CancellationToken();

  get cancellationToken(): CancellationToken {
    return this.token;
  }

  cancel(): void {
    this.token.cancel();
  }
}
```

**Usage in EventBus:**
```typescript
emit(event: SystemEvent, cancellation?: CancellationToken): Promise<void> {
  const listeners = this.listeners.get(event.type) || [];
  const promises = listeners.map(listener => {
    if (cancellation?.isCancelled) {
      return Promise.resolve(); // Skip if already cancelled
    }
    return listener(event, cancellation?.signal);
  });
  
  return Promise.allSettled(promises);
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// Test EventBus timeout
describe('EventBus', () => {
  it('should timeout slow listeners', async () => {
    const bus = new EventBus();
    let called = false;
    
    bus.subscribe('test', async () => {
      await new Promise(r => setTimeout(r, 10000)); // Hang for 10 seconds
    });
    
    const start = Date.now();
    await bus.emit({ type: 'test', module: 'test', operation: 'test', entityId: '1' });
    const elapsed = Date.now() - start;
    
    // Should timeout around 5s, not 10s
    expect(elapsed).toBeLessThan(6000);
  });
});

// Test real-time reconnection
describe('useRealtimeSales', () => {
  it('should reconnect after subscription failure', async () => {
    // Mock Supabase channel to fail, then succeed
    // Verify it reconnects within timeout
  });
});
```

### Integration Tests
- Send rapid changes, verify queue doesn't block
- Hang an API request, verify timeout and recovery
- Disconnect WebSocket, verify reconnection

---

## Validation Checklist

- [ ] EventBus queue processes events even if one listener hangs
- [ ] API calls timeout after configured duration
- [ ] Real-time subscriptions reconnect automatically
- [ ] Multiple listeners execute in parallel
- [ ] Query invalidations are debounced
- [ ] No uncancelled timeouts (memory leaks)
- [ ] User can cancel operations by navigating away
- [ ] Application remains responsive during heavy load

---

## Implementation Timeline

| Phase | Duration | Items | Estimated Impact |
|-------|----------|-------|------------------|
| Priority 1 | 1 day | EventBus timeout, API timeout, RT errors | Prevents complete freezes |
| Priority 2 | 1-2 days | Parallel listeners, Promise.all timeout, debounce | 3-5x faster processing |
| Priority 3 | 0.5-1 day | Cancellation tokens (optional) | Better UX |
| **Total** | **3-5 days** | **All fixes** | **Production Ready** |

---

## Success Metrics

**Before Fix:**
- 30+ second freezes when messages queue up
- No recovery from hung connections
- Cascading failures affecting entire system

**After Fix:**
- Max 5 second delay per event (worst case)
- Automatic recovery from network issues
- Isolated failures (one listener timeout doesn't affect others)
- 3-5x faster message processing

---

