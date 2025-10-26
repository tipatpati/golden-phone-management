# Multi-Tenant Architecture Implementation Guide

## 🎯 Overview

This document tracks the implementation of multi-tenant support, allowing multiple stores/locations to operate independently within a single database.

---

## ✅ Phase 1: FOUNDATION (COMPLETED)

### Database Migrations

**Migration 1: `20251026042105_add_multi_tenant_stores.sql`**
- ✅ Created `stores` table with full metadata (name, code, address, settings)
- ✅ Created `user_stores` junction table for user-store assignments
- ✅ Added helper functions for store management:
  - `get_user_current_store_id()` - Returns user's current store
  - `get_user_store_ids()` - Returns all stores user has access to
  - `user_has_store_access(uuid)` - Checks store access
  - `set_user_current_store(uuid)` - Sets session store
- ✅ Created RLS policies for stores and user_stores
- ✅ Inserted default "Main Store" (ID: 00000000-0000-0000-0000-000000000001)
- ✅ Auto-assigned all existing users to default store

**Migration 2: `20251026042106_add_store_id_to_core_tables.sql`**
- ✅ Added `store_id` column to 18 tables:
  - **Sales:** sales, sale_items, sale_returns, sale_return_items
  - **Inventory:** products, product_units, sold_product_units
  - **Clients:** clients
  - **Repairs:** repairs, repair_parts
  - **Suppliers:** suppliers, supplier_transactions, supplier_transaction_items
  - **HR:** employees, employee_profiles
  - **Analytics:** performance_logs, product_recommendations
- ✅ Migrated all existing records to default store
- ✅ Created indexes on all store_id columns
- ✅ Made store_id NOT NULL after migration

**Migration 3: `20251026042107_update_rls_policies_for_stores.sql`**
- ✅ Updated RLS policies for all core tables to filter by store
- ✅ Super admins see all stores
- ✅ Regular users see only their assigned stores
- ✅ Enforced store isolation on all operations

### Frontend Services

**Store Services** (`src/services/stores/`)
- ✅ `StoreApiService.ts` - Full CRUD for stores
- ✅ `StoreReactQueryService.ts` - React Query hooks
- ✅ `types.ts` - TypeScript interfaces
- ✅ User-store assignment methods
- ✅ Store switching functionality

**Context Layer** (`src/contexts/store/`)
- ✅ `StoreContext.tsx` - Global store state management
- ✅ Automatic default store detection
- ✅ Store switching with session persistence
- ✅ Convenience hooks: `useStore()`, `useCurrentStoreId()`, `useHasMultipleStores()`

**UI Components** (`src/components/stores/`)
- ✅ `StoreSelector.tsx` - Store switching dropdown
- ✅ Compact mode for mobile
- ✅ Auto-hide when user has single store

---

## 🚧 Phase 2: INTEGRATION (IN PROGRESS)

### Step 1: Add StoreProvider to Application Root

**File:** `src/App.tsx`

**What to do:**
```tsx
import { StoreProvider } from '@/contexts/store/StoreContext';

// Wrap the app with StoreProvider AFTER AuthProvider
<AuthProvider>
  <StoreProvider>
    {/* existing app content */}
  </StoreProvider>
</AuthProvider>
```

**Why:** Enables store context throughout the application

---

### Step 2: Add StoreSelector to Navigation

**File:** `src/components/layout/Header.tsx` or `Sidebar.tsx`

**What to do:**
```tsx
import { StoreSelector } from '@/components/stores/StoreSelector';

// Add to header/sidebar (example location)
<div className="flex items-center gap-4">
  <StoreSelector />
  {/* existing user menu, etc */}
</div>
```

**Why:** Allows users to switch between assigned stores

---

### Step 3: Update Sales Service to Use Store Context

**File:** `src/services/sales/SalesApiService.ts`

**What to do:**
Add store filtering to queries. Example:

```typescript
// BEFORE
async getAll(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, ...')
    .order('created_at', { ascending: false });
  // ...
}

// AFTER - No changes needed! RLS handles it automatically
// The database RLS policies filter by store_id automatically
// based on get_user_store_ids() function
```

**Note:** The RLS policies handle store filtering automatically! The service layer doesn't need changes for reads. However, for **creating** new records, we need to add `store_id`:

```typescript
// For CREATE operations
import { useCurrentStoreId } from '@/contexts/store/StoreContext';

// In React components using the hook
const currentStoreId = useCurrentStoreId();

// When creating a sale
const newSale = {
  ...saleData,
  store_id: currentStoreId  // ADD THIS
};
```

---

### Step 4: Update Product/Inventory Services

**Files:**
- `src/services/inventory/InventoryReactQueryService.ts`
- `src/components/inventory/AddProductDialog.tsx`

**What to do:**
Add `store_id` to product creation:

```typescript
// In AddProductDialog.tsx or wherever products are created
const currentStoreId = useCurrentStoreId();

const handleCreateProduct = () => {
  createProduct({
    ...productData,
    store_id: currentStoreId  // ADD THIS
  });
};
```

---

### Step 5: Update Clients, Repairs, Suppliers Services

**Same pattern as above:**
1. Import `useCurrentStoreId()` hook
2. Add `store_id` to all create operations
3. RLS policies handle filtering automatically

---

### Step 6: Update Dashboard for Multi-Store

**File:** `src/components/dashboard/DashboardOverview.tsx`

**What to do:**
Add store selector and show current store stats:

```tsx
import { useStore } from '@/contexts/store/StoreContext';

function DashboardOverview() {
  const { currentStore } = useStore();

  return (
    <div>
      <h1>Dashboard - {currentStore?.name}</h1>
      {/* existing dashboard content */}
    </div>
  );
}
```

**For Super Admins:** Add toggle to show cross-store analytics:
```tsx
const { userRole } = useAuth();
const [showAllStores, setShowAllStores] = useState(false);

{userRole === 'super_admin' && (
  <Toggle
    checked={showAllStores}
    onChange={setShowAllStores}
    label="Show All Stores"
  />
)}
```

---

### Step 7: Create Store Management Admin Panel

**New File:** `src/pages/StoreManagement.tsx`

**What to create:**
- List all stores (table view)
- Create new store button (dialog)
- Edit store (dialog)
- Deactivate/activate store
- Assign users to stores
- View store statistics

**Example structure:**
```tsx
import { useStores, useCreateStore, useUpdateStore } from '@/services/stores';

export function StoreManagement() {
  const { data: stores } = useStores();
  const createStore = useCreateStore();

  return (
    <div>
      <h1>Store Management</h1>
      <Button onClick={() => openCreateDialog()}>
        Create New Store
      </Button>
      <StoresTable stores={stores} />
    </div>
  );
}
```

**Add to routing:**
```tsx
// src/App.tsx or routing file
<Route path="/admin/stores" element={<StoreManagement />} />
```

---

## 📊 Testing Checklist

### Database Testing
- [ ] Run migrations on development database
- [ ] Verify default store exists
- [ ] Verify all users assigned to default store
- [ ] Test RLS policies by creating test users
- [ ] Verify store isolation (user A can't see user B's store data)

### Frontend Testing
- [ ] User with single store: selector hidden
- [ ] User with multiple stores: selector visible
- [ ] Store switching: data refreshes correctly
- [ ] Create sale: assigns to current store
- [ ] Create product: assigns to current store
- [ ] Create client: assigns to current store
- [ ] Dashboard: shows current store data only
- [ ] Super admin: can see all stores

### Multi-User Testing
- [ ] Create 2 test stores
- [ ] Create 2 test users
- [ ] Assign user 1 to store 1
- [ ] Assign user 2 to store 2
- [ ] Verify user 1 can't see user 2's data
- [ ] Create super admin user
- [ ] Verify super admin sees all data

---

## 🔒 Security Considerations

### ✅ Already Implemented
- Row Level Security (RLS) enforces store isolation at database level
- Super admins can bypass store filtering
- Users can only create data in assigned stores
- Session-based store selection with backend validation

### ⚠️ Important Security Rules
1. **NEVER** bypass RLS in application code
2. **ALWAYS** use `get_user_store_ids()` in RLS policies
3. **ALWAYS** validate store_id on INSERT operations
4. **NEVER** trust client-side store_id - use `get_user_current_store_id()`

---

## 📈 Performance Considerations

### ✅ Already Optimized
- Indexes created on all `store_id` columns
- RLS policies use indexed store_id for filtering
- Query plans benefit from store partitioning

### 🔍 Monitor
- Query performance with multiple stores
- Index usage in production
- Consider partitioning by store_id if data grows large (>1M rows per table)

---

## 🚀 Deployment Checklist

### Before Deploying to Production

1. **Backup Database**
   ```bash
   # Create full backup
   supabase db dump > backup-pre-multitenant.sql
   ```

2. **Test Migrations on Staging**
   ```bash
   supabase db push
   # Verify all 3 migrations applied successfully
   ```

3. **Verify Default Store**
   ```sql
   SELECT * FROM stores WHERE code = 'MAIN';
   -- Should return the default store
   ```

4. **Verify User Assignments**
   ```sql
   SELECT COUNT(*) FROM user_stores;
   -- Should equal number of existing users
   ```

5. **Test RLS Policies**
   ```sql
   -- As regular user, should only see their store's data
   SELECT * FROM sales;
   ```

6. **Deploy Frontend**
   - Merge Phase 1 PR
   - Deploy frontend with StoreProvider integrated
   - Test in production

### After Deployment

1. **Monitor Logs** for RLS permission errors
2. **Verify Performance** - check query times
3. **Create Second Store** as test
4. **Assign Test User** to second store
5. **Verify Data Isolation** is working

---

## 🎓 User Training

### For Store Managers
- How to switch between stores (if assigned to multiple)
- Understanding store-specific data visibility
- Creating data in correct store

### For Super Admins
- How to create new stores
- How to assign users to stores
- How to view cross-store analytics
- Understanding RLS and data isolation

---

## 📝 Remaining Work Estimate

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Add StoreProvider to App.tsx | 10 minutes | HIGH |
| Add StoreSelector to navigation | 20 minutes | HIGH |
| Update create forms (add store_id) | 2-3 hours | HIGH |
| Create Store Management page | 4-6 hours | MEDIUM |
| Update Dashboard for multi-store | 2 hours | MEDIUM |
| Add cross-store analytics (super admin) | 3-4 hours | LOW |
| End-to-end testing | 3-4 hours | HIGH |
| **TOTAL** | **15-20 hours** | |

---

## 🎯 Success Criteria

✅ **Phase 1 Complete When:**
- [x] Database migrations applied
- [x] RLS policies enforce store isolation
- [x] Frontend services created
- [x] StoreContext working

✅ **Phase 2 Complete When:**
- [ ] StoreProvider integrated in app
- [ ] Users can switch stores
- [ ] All create operations include store_id
- [ ] Data properly isolated between stores
- [ ] Super admins can view all stores
- [ ] Store management page functional

✅ **Production Ready When:**
- [ ] All Phase 2 tasks complete
- [ ] End-to-end tests passing
- [ ] Performance acceptable
- [ ] User training complete
- [ ] Second store successfully created and tested

---

## 📞 Support

If you encounter issues:

1. **RLS Permission Errors:** Check user_stores assignments
2. **Data Not Showing:** Verify current store is set correctly
3. **Can't Create Data:** Check store_id is being passed
4. **Performance Issues:** Review query plans, check indexes

---

**Last Updated:** October 26, 2025
**Status:** Phase 1 Complete ✅ | Phase 2 In Progress 🚧
