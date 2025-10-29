# Traceability Module - Supplier Information Documentation

## Overview

The Traceability Module provides complete product lifecycle tracking from acquisition to sale, including comprehensive supplier information and acquisition details.

## Current Implementation Status: ✅ COMPLETE

The traceability module **already displays** supplier information and acquisition numbers. Here's what's implemented:

---

## Components

### 1. Main Page: `ProductTracing.tsx`
**Location:** `src/pages/ProductTracing.tsx`

**Features:**
- Serial number search with autocomplete suggestions
- Two timeline views: Interactive and Event List
- Complete product lifecycle visualization

---

### 2. Supplier Acquisition Display: `TraceResultCard.tsx`
**Location:** `src/components/tracing/TraceResultCard.tsx`

**Supplier Information Displayed (Lines 157-355):**

#### A. Supplier Information Section
- ✅ **Supplier Name** (line 170-174)
- ✅ **Contact Person** (line 176-180)
- ✅ **Email Address** (line 182-186)
- ✅ **Phone Number** (line 188-193)

#### B. Transaction Details Section
- ✅ **Transaction Number** (line 201-206) - *This is the acquisition number*
- ✅ **Transaction ID** (line 207-212)
- ✅ **Transaction Type** (line 213-218)
- ✅ **Transaction Status** (line 219-230) - With status icons
- ✅ **Transaction Date** (line 231-236)
- ✅ **Quantity** (line 237-242)

#### C. Financial Details Section
- ✅ **Unit Cost** (line 250-254)
- ✅ **Total Cost** (line 256-261)

#### D. Complete Transaction Context
- ✅ **All products in transaction** (line 266-344) - Shows every item acquired together
- ✅ **Individual unit details** (line 320-339) - Shows specs for each unit
- ✅ **Transaction notes** (line 347-352)

---

### 3. Timeline View: `ProductTraceTimeline.tsx`
**Location:** `src/components/tracing/ProductTraceTimeline.tsx`

**Acquisition Event Display (Lines 104-125):**
- ✅ **Supplier Name** (line 106-110)
- ✅ **Transaction Number** (line 112-117)
- ✅ **Unit Cost** (line 118-123)

---

### 4. Data Service: `ProductTracingService.ts`
**Location:** `src/services/tracing/ProductTracingService.ts`

**Data Fetching (Lines 88-127):**

Queries include:
```sql
supplier_transaction_items
  - unit_cost, total_cost, quantity
  - supplier_transactions!inner (
      transaction_number,      -- ✅ Acquisition number
      transaction_date,
      type,
      status,
      notes,
      suppliers (             -- ✅ Supplier info
        name,
        contact_person,
        email,
        phone
      )
    )
```

**Acquisition History Data Structure (Lines 260-293):**
```typescript
acquisitionHistory: {
  supplier_id: string,
  supplier_name: string,           // ✅
  supplier_contact: string,         // ✅
  supplier_email: string,           // ✅
  supplier_phone: string,           // ✅
  transaction_id: string,
  transaction_number: string,       // ✅ Acquisition number
  transaction_type: string,
  transaction_date: string,
  transaction_status: string,
  unit_cost: number,
  total_cost: number,
  quantity: number,
  transaction_items: [...],         // ✅ All items in transaction
  notes: string
}
```

---

## Example Usage

### How to Trace a Product:

1. **Navigate** to Product Tracing page
2. **Enter** serial number (e.g., "350282719252157")
3. **View** complete lifecycle:

#### What You'll See:

**Product Information Card:**
```
┌─────────────────────────────────────────────┐
│ 📱 Apple iPhone 13 Pro                      │
│ Serial: 350282719252157                     │
│ Status: [sold]                              │
├─────────────────────────────────────────────┤
│ 📦 Supplier Acquisition Details             │
│                                             │
│ Supplier Information                        │
│ ├─ 🏢 TechSupply Italia                    │
│ ├─ 👤 Contact: Mario Rossi                 │
│ ├─ ✉️ mario@techsupply.it                  │
│ └─ ☎️ +39 02 1234567                       │
│                                             │
│ Transaction Details                         │
│ ├─ 🧾 TX: ACQ-2024-0123                    │
│ ├─ #  ID: uuid-here                        │
│ ├─ 📄 Type: acquisition                    │
│ ├─ ✓  Status: completed                    │
│ ├─ 📅 Date: Jan 15, 2024 10:30            │
│ └─ 📦 Quantity: 5                          │
│                                             │
│ Financial Details                           │
│ ├─ 💶 Unit Cost: €850.00                   │
│ └─ 💶 Total Cost: €4,250.00                │
│                                             │
│ All Products in Transaction (5)             │
│ [Shows all items acquired together]         │
└─────────────────────────────────────────────┘
```

---

## Troubleshooting

### If Supplier Information is Missing:

#### Possible Causes:

1. **Product added before supplier tracking was implemented**
   - Old products may not have supplier data

2. **Product unit not linked to supplier transaction**
   - Check if `product_unit_ids` array in supplier_transaction_items includes this unit

3. **Supplier transaction deleted or incomplete**
   - Transaction must have status 'completed' to show full details

#### How to Verify:

```sql
-- Check if product unit has supplier transaction
SELECT
  pu.serial_number,
  pu.id as unit_id,
  sti.id as transaction_item_id,
  st.transaction_number,
  s.name as supplier_name
FROM product_units pu
LEFT JOIN supplier_transaction_items sti
  ON sti.product_unit_ids @> ARRAY[pu.id]
LEFT JOIN supplier_transactions st
  ON st.id = sti.transaction_id
LEFT JOIN suppliers s
  ON s.id = st.supplier_id
WHERE pu.serial_number = 'YOUR_SERIAL_HERE';
```

---

## Technical Implementation Details

### Data Flow:

```
User Search
    ↓
ProductTracingService.traceProductBySerial()
    ↓
1. Find product_unit by serial_number
2. Query supplier_transaction_items (contains product_unit_ids)
3. Join with supplier_transactions
4. Join with suppliers table
    ↓
Build ProductTraceResult with acquisitionHistory
    ↓
Display in TraceResultCard
```

### Key Database Relationships:

```
suppliers
    ↓ (supplier_id)
supplier_transactions
    ↓ (transaction_id)
supplier_transaction_items
    ↓ (product_unit_ids array)
product_units
```

---

## Conclusion

**The traceability module fully supports supplier information and acquisition numbers.**

All the requested features are already implemented:
- ✅ Supplier name and contact details
- ✅ Supplier acquisition number (transaction_number)
- ✅ Complete transaction context
- ✅ Financial information (costs)
- ✅ All products in the same acquisition

If you're not seeing this information for specific products, they may have been added without proper supplier transaction linkage.
