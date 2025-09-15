/**
 * Final Batch Migration - Complete All Remaining Files
 */

import fs from 'fs';
import { glob } from 'glob';

// Files that need migration
const TARGET_FILES = [
  'src/components/admin/ServiceMonitoringDashboard.tsx',
  'src/components/admin/UnifiedDataIntegrityDashboard.tsx', 
  'src/components/admin/UnifiedProductIntegrityDashboard.tsx',
  'src/components/app/AccountSetupScreen.tsx',
  'src/components/auth/SecureLoginForm.tsx',
  'src/components/clients/ClientsSearchBar.tsx',
  'src/components/clients/DeleteClientDialog.tsx',
  'src/components/clients/EditClientDialog.tsx',
  'src/components/clients/EmptyClientsList.tsx',
  'src/components/clients/EnhancedClientsList.tsx',
  'src/components/clients/NewClientDialog.tsx',
  'src/components/clients/ui/ClientCard.tsx',
  'src/components/clients/ui/ClientDetailsView.tsx',
  'src/components/common/BaseForm.tsx',
  'src/components/common/DataCard.tsx',
  'src/components/common/DataTable.tsx',
  'src/components/common/EmptyState.tsx',
  'src/components/common/EnhancedErrorBoundary.tsx',
  'src/components/common/ErrorBoundary.tsx',
  'src/components/common/ErrorBoundaryWithRetry.tsx',
  'src/components/common/PageHeader.tsx',
  'src/components/common/ResponsiveFormComponents.tsx',
  'src/components/common/SearchAndFilter.tsx',
  'src/components/dashboard/InventoryStatus.tsx',
  'src/components/dashboard/RecentSales.tsx',
  'src/components/dashboard/RepairStatsCards.tsx',
  'src/components/dashboard/RepairStatus.tsx',
  'src/components/dashboard/SalesOverview.tsx',
];

const MIGRATION_PATTERNS = [
  {
    from: /from ['"]@\/components\/ui\/card['"]/g,
    to: `from '@/components/ui/updated-card'`
  },
  {
    from: /from ['"]@\/components\/ui\/button['"]/g,
    to: `from '@/components/ui/updated-button'`
  },
  {
    from: /from ['"]@\/components\/ui\/dialog['"]/g,
    to: `from '@/components/ui/updated-dialog'`
  },
  // Button variants
  {
    from: /variant=["']outline["']/g,
    to: `variant="outlined"`
  },
  {
    from: /variant=["']default["']/g,
    to: `variant="filled"`
  },
  {
    from: /variant=["']secondary["']/g,
    to: `variant="filled-tonal"`
  },
  {
    from: /variant=["']ghost["']/g,
    to: `variant="text"`
  },
  // Color migrations
  {
    from: /\btext-white\b/g,
    to: 'text-primary-foreground'
  },
  {
    from: /\btext-black\b/g,
    to: 'text-foreground'
  },
  {
    from: /\bbg-white\b/g,
    to: 'bg-background'
  },
  {
    from: /\bbg-black\b/g,
    to: 'bg-foreground'
  },
  {
    from: /\btext-gray-500\b/g,
    to: 'text-muted-foreground'
  },
  {
    from: /\btext-gray-600\b/g,
    to: 'text-muted-foreground'
  },
  {
    from: /\btext-gray-700\b/g,
    to: 'text-foreground'
  },
  {
    from: /\btext-gray-800\b/g,
    to: 'text-foreground'
  },
  {
    from: /\btext-gray-900\b/g,
    to: 'text-foreground'
  },
  {
    from: /\bbg-gray-50\b/g,
    to: 'bg-muted/50'
  },
  {
    from: /\bbg-gray-100\b/g,
    to: 'bg-muted'
  },
  {
    from: /\bbg-gray-200\b/g,
    to: 'bg-border'
  },
  {
    from: /\bborder-gray-200\b/g,
    to: 'border-border'
  },
  {
    from: /\bborder-gray-300\b/g,
    to: 'border-border'
  }
];

function migrateFileContent(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    for (const pattern of MIGRATION_PATTERNS) {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Migrated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error);
    return false;
  }
}

// Execute migration
console.log('🚀 Starting final batch migration...');

let migratedCount = 0;
for (const file of TARGET_FILES) {
  if (migrateFileContent(file)) {
    migratedCount++;
  }
}

console.log(`✨ Final batch migration complete: ${migratedCount} files migrated`);

export { migrateFileContent };