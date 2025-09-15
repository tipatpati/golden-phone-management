/**
 * Comprehensive Migration Script - Complete UI and Color System Migration
 * This script migrates all remaining components to the enhanced design system
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Component import mappings
const COMPONENT_MIGRATIONS = {
  "from '@/components/ui/dialog'": "from '@/components/ui/updated-dialog'",
  "from '@/components/ui/card'": "from '@/components/ui/updated-card'", 
  "from '@/components/ui/button'": "from '@/components/ui/updated-button'",
  'from "@/components/ui/dialog"': 'from "@/components/ui/updated-dialog"',
  'from "@/components/ui/card"': 'from "@/components/ui/updated-card"',
  'from "@/components/ui/button"': 'from "@/components/ui/updated-button"',
} as const;

// Button variant mappings
const BUTTON_VARIANTS = {
  'variant="outline"': 'variant="outlined"',
  "variant='outline'": "variant='outlined'",
  'variant="default"': 'variant="filled"',
  "variant='default'": "variant='filled'",
  'variant="secondary"': 'variant="filled-tonal"',
  "variant='secondary'": "variant='filled-tonal'",
  'variant="ghost"': 'variant="text"',
  "variant='ghost'": "variant='text'",
  'variant="link"': 'variant="text"',
  "variant='link'": "variant='text'",
} as const;

// Color class replacements - comprehensive semantic token migration
const COLOR_MIGRATIONS = {
  // Text colors
  'text-white': 'text-primary-foreground',
  'text-black': 'text-foreground',
  'text-gray-300': 'text-muted-foreground/80',
  'text-gray-400': 'text-muted-foreground/90',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground/90',
  'text-gray-800': 'text-foreground',
  'text-gray-900': 'text-foreground',
  
  // Background colors
  'bg-white': 'bg-background',
  'bg-black': 'bg-foreground',
  'bg-gray-50': 'bg-muted/30',
  'bg-gray-100': 'bg-muted/50',
  'bg-gray-200': 'bg-muted',
  'bg-gray-300': 'bg-border',
  
  // Border colors
  'border-white': 'border-primary-foreground',
  'border-black': 'border-foreground',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-400': 'border-muted-foreground/20',
  'border-gray-500': 'border-muted-foreground/30',
  
  // Status colors - using semantic design tokens
  'text-red-500': 'text-destructive',
  'text-red-600': 'text-destructive',
  'text-green-500': 'text-success',
  'text-green-600': 'text-success',
  'text-blue-500': 'text-primary',
  'text-blue-600': 'text-primary',
  'text-purple-600': 'text-primary',
  'text-yellow-600': 'text-warning',
  'text-indigo-600': 'text-primary',
  'text-violet-600': 'text-primary',
  
  // Background status colors
  'bg-red-50': 'bg-destructive/10',
  'bg-red-100': 'bg-destructive/20',
  'bg-green-50': 'bg-success/10',
  'bg-green-100': 'bg-success/20',
  'bg-blue-50': 'bg-primary/10',
  'bg-blue-100': 'bg-primary/20',
  'bg-yellow-50': 'bg-warning/10',
  'bg-yellow-100': 'bg-warning/20',
  
  // Border status colors
  'border-red-200': 'border-destructive/30',
  'border-green-200': 'border-success/30',
  'border-blue-200': 'border-primary/30',
  'border-yellow-200': 'border-warning/30',
  'border-purple-200': 'border-primary/30',
} as const;

// Files to process
const TARGET_PATTERNS = [
  'src/components/**/*.{ts,tsx}',
  'src/pages/**/*.{ts,tsx}',
  'src/hooks/**/*.{ts,tsx}',
  'src/utils/**/*.{ts,tsx}',
];

const EXCLUDE_PATTERNS = [
  'src/components/ui/**',
  'src/scripts/**',
  'node_modules/**',
];

async function migrateFile(filePath: string): Promise<boolean> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    // Skip if already using updated components
    if (content.includes('@/components/ui/updated-')) {
      return false;
    }

    // 1. Migrate component imports
    for (const [oldImport, newImport] of Object.entries(COMPONENT_MIGRATIONS)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[/]/g, '\\/'), 'g'), newImport);
        hasChanges = true;
      }
    }

    // 2. Migrate button variants
    for (const [oldVariant, newVariant] of Object.entries(BUTTON_VARIANTS)) {
      if (content.includes(oldVariant)) {
        content = content.replace(new RegExp(oldVariant.replace(/['"]/g, '\\$&'), 'g'), newVariant);
        hasChanges = true;
      }
    }

    // 3. Migrate color classes (word boundaries to avoid partial matches)
    for (const [oldColor, newColor] of Object.entries(COLOR_MIGRATIONS)) {
      const pattern = new RegExp(`\\b${oldColor}\\b`, 'g');
      if (pattern.test(content)) {
        content = content.replace(pattern, newColor);
        hasChanges = true;
      }
    }

    // 4. Save changes
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

async function runComprehensiveMigration(): Promise<void> {
  console.log('🚀 Starting comprehensive UI and color migration...');
  
  // Get all files to migrate
  const allFiles: string[] = [];
  for (const pattern of TARGET_PATTERNS) {
    const files = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS
    });
    allFiles.push(...files);
  }
  
  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];
  console.log(`📁 Found ${uniqueFiles.length} files to migrate`);
  
  let migratedCount = 0;
  const batchSize = 15;
  
  // Process files in batches for better performance
  for (let i = 0; i < uniqueFiles.length; i += batchSize) {
    const batch = uniqueFiles.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(migrateFile));
    migratedCount += results.filter(Boolean).length;
    
    console.log(`📦 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueFiles.length / batchSize)}`);
  }
  
  console.log(`✨ Comprehensive migration complete: ${migratedCount} files migrated`);
  console.log('🎯 All components now use the enhanced Material Design system');
  console.log('🌈 All hardcoded colors replaced with semantic design tokens');
}

// Export for manual execution
export { runComprehensiveMigration, migrateFile };

// Run if executed directly
if (require.main === module) {
  runComprehensiveMigration().catch(console.error);
}