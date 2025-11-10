# Product Name Suggestions - Usage Guide

## Simple Implementation Without Separate Database

The `useProductNameSuggestions` hooks extract brand/model names from your existing `products` table - no additional database needed!

## Available Hooks

### 1. **useProductNameSuggestions** (All-in-one)
```tsx
import { useProductNameSuggestions } from '@/hooks/useProductNameSuggestions';

function MyForm() {
  const { brandSuggestions, modelSuggestions, isLoading } = useProductNameSuggestions();

  // Use brandSuggestions and modelSuggestions in AutocompleteInput
}
```

### 2. **useBrandSuggestions** (Brands only)
```tsx
import { useBrandSuggestions } from '@/hooks/useProductNameSuggestions';

const { brandSuggestions, isLoading } = useBrandSuggestions();
```

### 3. **useModelSuggestions** (Models for specific brand)
```tsx
import { useModelSuggestions } from '@/hooks/useProductNameSuggestions';

const [selectedBrand, setSelectedBrand] = useState('Apple');
const { modelSuggestions, isLoading } = useModelSuggestions(selectedBrand);
// Returns only models for "Apple"
```

### 4. **useEnhancedBrandSuggestions** (With fallback brands)
```tsx
import { useEnhancedBrandSuggestions } from '@/hooks/useProductNameSuggestions';

const { brandSuggestions, isLoading } = useEnhancedBrandSuggestions();
// Combines existing brands + common brands (Apple, Samsung, etc.)
```

---

## Integration Example

### Option 1: Update ProductFormFieldsContainer (Recommended)

Replace the brand/model Input fields with AutocompleteInput:

```tsx
// src/components/inventory/forms/ProductFormFieldsContainer.tsx

import { AutocompleteInput } from "@/components/shared/AutocompleteInput";
import { useEnhancedBrandSuggestions, useModelSuggestions } from "@/hooks/useProductNameSuggestions";

export function ProductFormFields({
  formData,
  onFieldChange,
  getFieldError,
  // Remove uniqueBrands and uniqueModels props - we'll get them from hooks
}: ProductFormFieldsProps) {
  // Get brand suggestions (with common brands as fallback)
  const { brandSuggestions } = useEnhancedBrandSuggestions();

  // Get model suggestions filtered by selected brand
  const { modelSuggestions } = useModelSuggestions(formData.brand);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand Field with Autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm font-medium flex items-center gap-1">
            Brand
            <span className="text-destructive">*</span>
          </Label>
          <AutocompleteInput
            value={formData.brand || ""}
            onChange={(value) => onFieldChange("brand", value)}
            suggestions={brandSuggestions}
            entityTypes={[]} // Disable dynamic search, use only static suggestions
            placeholder="e.g., Apple, Samsung"
            className={getFieldError("brand") ? "border-destructive" : ""}
          />
          {getFieldError("brand") && (
            <p className="text-xs text-destructive">{getFieldError("brand")}</p>
          )}
        </div>

        {/* Model Field with Autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="model" className="text-sm font-medium flex items-center gap-1">
            Model
            <span className="text-destructive">*</span>
          </Label>
          <AutocompleteInput
            value={formData.model || ""}
            onChange={(value) => onFieldChange("model", value)}
            suggestions={modelSuggestions}
            entityTypes={[]} // Disable dynamic search
            placeholder={formData.brand ? `e.g., iPhone 13` : "Select brand first"}
            disabled={!formData.brand} // Disable until brand is selected
            className={getFieldError("model") ? "border-destructive" : ""}
          />
          {getFieldError("model") && (
            <p className="text-xs text-destructive">{getFieldError("model")}</p>
          )}
        </div>
      </div>

      {/* Rest of form fields... */}
    </div>
  );
}
```

### Option 2: Simple Static Suggestions

If you just want basic suggestions without hooks:

```tsx
// Hardcoded common brands/models (minimal approach)
const COMMON_BRANDS = [
  'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi',
  'Huawei', 'Oppo', 'Sony', 'LG', 'Motorola'
];

const COMMON_MODELS = {
  'Apple': ['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPad Pro', 'MacBook Air'],
  'Samsung': ['Galaxy S24', 'Galaxy S23', 'Galaxy A54', 'Galaxy Tab S9'],
  'Google': ['Pixel 8', 'Pixel 7', 'Pixel 6'],
  // ... more models
};

// In your component:
<AutocompleteInput
  value={formData.brand}
  onChange={(v) => onFieldChange("brand", v)}
  suggestions={COMMON_BRANDS}
  entityTypes={[]}
/>
```

---

## How It Works

1. **First time** - Uses hardcoded common brands (Apple, Samsung, etc.)
2. **After products exist** - Extracts unique brands from your products table
3. **Combined** - Shows both existing + common brands
4. **Model filtering** - When brand is selected, only shows models for that brand

### Data Flow

```
User types "App..." in brand field
    ↓
AutocompleteInput shows suggestions:
  - Apple (from database)
  - Appleberry (from database if exists)
    ↓
User selects "Apple"
    ↓
Model field enabled
    ↓
User types "iPh..." in model field
    ↓
AutocompleteInput shows suggestions:
  - iPhone 15 (from database)
  - iPhone 14 (from database)
  - iPhone 13 (from database)
    ↓
User selects "iPhone 13"
```

---

## Benefits

✅ **No separate database** - Uses existing products table
✅ **Learns from data** - Suggestions grow as you add products
✅ **Fast autocomplete** - Instant suggestions
✅ **Smart filtering** - Models filter by selected brand
✅ **Fallback brands** - Common brands even when database is empty
✅ **Simple implementation** - Just one hook to use

---

## Performance Notes

- Fetches all brands/models once on mount
- Caches in component state
- No database query on every keystroke
- For large datasets (1000+ products), consider:
  - Using the dynamic search (`entityTypes=['brand', 'model']`)
  - Adding pagination to the query
  - Using React Query for caching

---

## Migration Path

### Phase 1: Start Simple ✅
```tsx
// Use static suggestions
suggestions={['Apple', 'Samsung', 'Google']}
```

### Phase 2: Add Database Suggestions ✅
```tsx
// Use hook to get suggestions from database
const { brandSuggestions } = useBrandSuggestions();
```

### Phase 3: Enhanced with Fallback ✅
```tsx
// Best of both worlds
const { brandSuggestions } = useEnhancedBrandSuggestions();
```

### Phase 4: Full Dynamic Search (Optional)
```tsx
// Use OptimizedSearchService for real-time search
entityTypes={['brand', 'model']}
```

---

## Example: Complete Product Form

```tsx
import React from 'react';
import { AutocompleteInput } from '@/components/shared/AutocompleteInput';
import { useEnhancedBrandSuggestions, useModelSuggestions } from '@/hooks/useProductNameSuggestions';

export function ProductForm() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  const { brandSuggestions } = useEnhancedBrandSuggestions();
  const { modelSuggestions } = useModelSuggestions(brand);

  return (
    <form>
      <div className="space-y-4">
        {/* Brand */}
        <AutocompleteInput
          value={brand}
          onChange={setBrand}
          suggestions={brandSuggestions}
          entityTypes={[]} // Static only
          placeholder="Brand name..."
        />

        {/* Model */}
        <AutocompleteInput
          value={model}
          onChange={setModel}
          suggestions={modelSuggestions}
          entityTypes={[]} // Static only
          placeholder={brand ? "Model name..." : "Select brand first"}
          disabled={!brand}
        />
      </div>
    </form>
  );
}
```

---

## Testing

1. **Empty database:** Should show common brands (Apple, Samsung, etc.)
2. **With data:** Should show both existing + common brands
3. **Brand selection:** Model field should enable and show relevant models
4. **Typing:** Should filter suggestions as you type
5. **Keyboard nav:** Arrow keys should work

---

## Future Enhancements (Optional)

- Add year suggestions based on existing data
- Cache suggestions in localStorage
- Add category-specific model suggestions
- Integrate with barcode scanner to auto-fill
