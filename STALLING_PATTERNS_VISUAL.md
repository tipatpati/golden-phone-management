# Message Stalling Patterns - Visual Architecture

## Current Architecture (With Issues)

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION USER                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              React Components (UI Layer)                        │
│  useRealtimeSales() ─┐                                          │
│  useRealtimeInventory() ├──> queryClient.invalidateQueries()   │
│  useRealtimeTransactions() ┘   [NO ERROR HANDLING]              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│        Supabase Real-time (WebSocket)                           │
│  ⚠️ NO ERROR HANDLING                                           │
│  ⚠️ NO RECONNECTION LOGIC                                       │
│  ⚠️ SILENT FAILURE ON DISCONNECT                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│            EventBus (Message Queue)                             │
│  ┌───────────────────────────────────────────────────┐          │
│  │ Queue: [Event A] [Event B] [Event C] [Event D]   │          │
│  └───────────┬─────────────────────────────────────┘  │
│              │                                        │
│              ▼ processQueue() - SEQUENTIAL             │
│  ┌──────────────────────────────────────────────┐     │
│  │ isProcessing = true                          │     │
│  │ while (queue.length > 0) {                   │     │
│  │   event = queue.shift()                      │     │
│  │   ⚠️ await processEvent(event) [NO TIMEOUT]  │     │
│  │ }                                             │     │
│  └──────────────────────────────────────────────┘     │
│                                                       │
│  PROBLEM: If Event A hangs,                          │
│  Events B, C, D are BLOCKED FOREVER                  │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│         EventBus Listener Execution                             │
│  ┌──────────────────────────────────────────────┐               │
│  │ for (subscription of subscriptions) {         │               │
│  │   ⚠️ await subscription.listener(event)      │               │
│  │     [SEQUENTIAL, NO TIMEOUT]                 │               │
│  │ }                                             │               │
│  └──────────────────────────────────────────────┘               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│       API Layer (BaseApiService)                                │
│  ⚠️ NO TIMEOUT ENFORCEMENT                                      │
│  ⚠️ NO ABORT CONTROLLER                                         │
│  ⚠️ HTTP REQUESTS CAN HANG INDEFINITELY                         │
│                                                                 │
│  performQuery() {                                               │
│    const { data, error } = await queryBuilder;                  │
│    // If queryBuilder hangs, THIS HANGS FOREVER                │
│  }                                                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Database                                  │
│  ⚠️ NETWORK CAN TIMEOUT                                         │
│  ⚠️ SERVER CAN HANG                                             │
│  ⚠️ NO GRACEFUL DEGRADATION                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Stalling Cascade Scenario

```
Time 0ms:  useRealtimeSales receives message from WebSocket
           → emit event to EventBus
           
Time 1ms:  Event added to queue
           isProcessing = true
           processQueue() starts processing Event A
           
Time 2ms:  processEvent(Event A) executes listeners
           Listener 1: queryClient.invalidateQueries(['sales'])
           Listener 2: updates cache
           Listener 3: triggers Analytics API call
           
Time 3ms:  Analytics API call HANGS (network timeout)
           await subscription.listener() still waiting
           
Time 10ms: Listener 1 completes (after 8ms)
           Listener 2 completes (after 8ms)
           Listener 3 STILL WAITING (API call hanging)
           
Time 30ms: API call timeout ❌
           But NO TIMEOUT ENFORCED, so listener STILL WAITING
           
Time 60s+: User perceives "freeze"
           Events B, C, D in queue NEVER PROCESS
           Real-time updates BLOCKED
           Application UNRESPONSIVE

   Meanwhile in the queue:
   ┌─────────────────────────────────────────┐
   │ Processing: [Event A 🔄 STUCK]          │
   │ Waiting:    [Event B] [Event C] [Event D] [Event E] ...
   │                                          │
   │ Queue grows, but nothing processes       │
   └─────────────────────────────────────────┘
```

## Comparison: With Proper Timeouts & Cancellation

```
┌─────────────────────────────────────────────────────────────────┐
│              EventBus with Timeout Support                      │
│  ┌───────────────────────────────────────────────────┐          │
│  │ processQueue() {                                  │          │
│  │   for (event of queue) {                          │          │
│  │     ✅ await withTimeout(processEvent(event),     │          │
│  │        LISTENER_TIMEOUT);                         │          │
│  │   }                                                │          │
│  │ }                                                  │          │
│  │                                                    │          │
│  │ withTimeout(promise, ms) {                         │          │
│  │   return Promise.race([                            │          │
│  │     promise,                                       │          │
│  │     new Promise((_, reject) =>                     │          │
│  │       setTimeout(() => reject('TIMEOUT'), ms))    │          │
│  │   ]);                                              │          │
│  │ }                                                  │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                  │
│  BENEFIT: If listener hangs, it's skipped after TIMEOUT        │
│  Queue continues processing remaining events                    │
└─────────────────────────────────────────────────────────────────┘
```

## Request Timeout Pattern

```
Current (Broken):
┌──────────────────────────────────────────┐
│ API Request starts                       │
│ ├─ 0ms: Sent to server                  │
│ ├─ 1000ms: No response yet               │
│ ├─ 10000ms: Configured timeout hit BUT   │
│ │           NO ENFORCEMENT               │
│ ├─ 30000ms: Still waiting... 😞         │
│ ├─ 60000ms: Still waiting... 😢         │
│ └─ ∞: Never resolves!                   │
└──────────────────────────────────────────┘

Fixed (With AbortController):
┌──────────────────────────────────────────┐
│ API Request starts                       │
│ ├─ 0ms: Sent to server                  │
│ ├─ 5000ms: Using AbortSignal             │
│ ├─ 10000ms: Timeout triggered            │
│ │           controller.abort() called    │
│ │           Request CANCELLED ✅         │
│ ├─ 10005ms: Catch block catches error   │
│ │           Returns error to listener    │
│ └─ Listener can retry or handle error    │
└──────────────────────────────────────────┘

Code Example:
async function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Timeout'));
        });
      })
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
```

## Listener Execution: Sequential vs Parallel

```
CURRENT (Sequential - SLOW):
Time →
Listener 1: [====== 100ms ======]
Listener 2:                      [====== 100ms ======]
Listener 3:                                           [===== 50ms =====]
─────────────────────────────────────────────────────────────
Total: 250ms ⚠️

If one hangs:
Listener 1: [====== HANGING... forever... ======>
Listener 2: [waiting...]
Listener 3: [waiting...]
Result: ALL LISTENERS BLOCKED


BETTER (Parallel with Timeout):
Time →
Listener 1: [====== 100ms ======]
Listener 2: [====== 100ms ======]
Listener 3: [===== 50ms =====]
─────────────────────────────────────────
Total: 100ms (max of all) ✅

If one hangs:
Listener 1: [====== TIMEOUT @ 500ms ======]
Listener 2: [====== 100ms ======] ✅
Listener 3: [===== 50ms =====] ✅
Result: Listener 1 timed out, others completed ✅
```

## Missing Cancellation Mechanism

```
Current State:
┌────────────────────────────────────────┐
│ User Action (e.g., navigate away)      │
├────────────────────────────────────────┤
│ No way to:                             │
│ ❌ Cancel event                        │
│ ❌ Cancel listener                     │
│ ❌ Cancel API call                     │
│ ❌ Cancel processing                   │
│                                        │
│ Result: Operation CONTINUES            │
│ Component unmounts with HANGING Promise │
└────────────────────────────────────────┘

What's Needed:
┌────────────────────────────────────────┐
│ AbortSignal Pattern                    │
├────────────────────────────────────────┤
│ const controller = new AbortController()│
│ emit(event, controller.signal)         │
│ // User navigates away...              │
│ controller.abort()  // All operations  │
│ // listening to signal stop ✅        │
└────────────────────────────────────────┘

Usage in Listener:
async function listener(event, signal) {
  signal.addEventListener('abort', () => {
    console.log('Listener cancelled');
  });
  
  try {
    await fetch(url, { signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      // Gracefully handle cancellation
      return;
    }
    throw e;
  }
}
```

---

## Key Statistics

- **12 identified stalling patterns**
- **5 CRITICAL issues** that cause complete freezes
- **4 HIGH-risk issues** that cause frequent hangs
- **3 MEDIUM-risk issues** that degrade performance
- **0 timeout enforcement** mechanisms in EventBus queue
- **0 AbortController usage** in API calls
- **0 error handlers** in real-time subscriptions
- **3 Promise.all calls** without timeout
- **1 sequential listener pattern** that creates bottlenecks
- **Multiple memory leaks** from uncancelled timeouts

---

## Root Cause Analysis

```
Why Messages Stall:
└─ No Timeout Enforcement (EventBus)
└─ No AbortController (API Calls)
└─ No Error Handling (Real-time)
└─ Sequential Processing (Listeners)
└─ Promise.all Without Timeout
└─ No Cancellation Token

Why Cancellation Doesn't Work:
└─ No AbortSignal passed to listeners
└─ No CancellationToken mechanism
└─ setTimeout doesn't actually interrupt
└─ Promises never resolve/reject on cancel
└─ No way to signal intent to stop
```

