#!/bin/bash

# UI Component Migration Script
# Systematically updates all component imports to use the enhanced UI system

echo "🔄 Starting UI Component Migration..."

# Phase 1: Migrate Card imports
echo "📦 Phase 1: Migrating Card imports..."
find src -type f -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/ui/card.tsx" -not -path "*/ui/updated-card.tsx" -not -path "*/ui/enhanced-card.tsx" | while read file; do
  if grep -q 'from "@/components/ui/card"' "$file"; then
    sed -i 's|from "@/components/ui/card"|from "@/components/ui/updated-card"|g' "$file"
    echo "  ✓ Updated: $file"
  fi
done

# Phase 2: Migrate Button imports  
echo "🔘 Phase 2: Migrating Button imports..."
find src -type f -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/ui/button.tsx" -not -path "*/ui/updated-button.tsx" -not -path "*/ui/enhanced-button.tsx" | while read file; do
  if grep -q 'from "@/components/ui/button"' "$file"; then
    sed -i 's|from "@/components/ui/button"|from "@/components/ui/updated-button"|g' "$file"
    echo "  ✓ Updated: $file"
  fi
done

# Phase 3: Migrate Dialog imports
echo "💬 Phase 3: Migrating Dialog imports..."
find src -type f -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/ui/dialog.tsx" -not -path "*/ui/updated-dialog.tsx" -not -path "*/ui/enhanced-dialog.tsx" | while read file; do
  if grep -q 'from "@/components/ui/dialog"' "$file"; then
    sed -i 's|from "@/components/ui/dialog"|from "@/components/ui/updated-dialog"|g' "$file"
    echo "  ✓ Updated: $file"
  fi
done

# Phase 4: Update button variants
echo "🎨 Phase 4: Updating button variants..."
find src -type f -name "*.tsx" -not -path "*/node_modules/*" | while read file; do
  # Replace variant props
  sed -i 's/variant="outline"/variant="outlined"/g' "$file"
  sed -i 's/variant="default"/variant="filled"/g' "$file"
  sed -i 's/variant="secondary"/variant="filled-tonal"/g' "$file"
  sed -i 's/variant="ghost"/variant="text"/g' "$file"
  sed -i 's/variant="link"/variant="text"/g' "$file"
done

echo "✅ Migration complete!"
echo ""
echo "📊 Summary:"
echo "  - Card imports migrated to @/components/ui/updated-card"
echo "  - Button imports migrated to @/components/ui/updated-button"
echo "  - Dialog imports migrated to @/components/ui/updated-dialog"
echo "  - Button variants updated to Material Design 3 system"
echo ""
echo "⚠️  Please review changes and test thoroughly!"
