/**
 * Mass UI Migration Script
 * Automated migration from legacy UI components to enhanced design system
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Component import mappings
const COMPONENT_MIGRATIONS = {
  '@/components/ui/dialog': '@/components/ui/updated-dialog',
  '@/components/ui/card': '@/components/ui/updated-card', 
  '@/components/ui/button': '@/components/ui/updated-button',
} as const;

// Button variant mappings
const BUTTON_VARIANTS = {
  'outline': 'outlined',
  'default': 'filled',
  'secondary': 'filled-tonal',
  'ghost': 'text',
  'link': 'text',
} as const;

// Color class replacements
const COLOR_MIGRATIONS = {
  // Text colors
  'text-white': 'text-primary-foreground',
  'text-black': 'text-foreground', 
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-900': 'text-foreground',
  
  // Background colors
  'bg-white': 'bg-background',
  'bg-black': 'bg-foreground',
  'bg-gray-50': 'bg-muted/50',
  'bg-gray-100': 'bg-muted',
  'bg-gray-200': 'bg-border',
  
  // Border colors
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-white': 'border-primary-foreground',
  'border-black': 'border-foreground',
} as const;

async function migrateFile(filePath: string): Promise<void> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // 1. Migrate component imports
    for (const [oldImport, newImport] of Object.entries(COMPONENT_MIGRATIONS)) {
      const oldPattern = new RegExp(`from ['"]${oldImport.replace(/[/]/g, '\\/')}['"]`, 'g');
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, `from '${newImport}'`);
        hasChanges = true;
      }
    }

    // 2. Migrate button variants
    for (const [oldVariant, newVariant] of Object.entries(BUTTON_VARIANTS)) {
      const variantPattern = new RegExp(`variant=["']${oldVariant}["']`, 'g');
      if (variantPattern.test(content)) {
        content = content.replace(variantPattern, `variant="${newVariant}"`);
        hasChanges = true;
      }
    }

    // 3. Migrate color classes
    for (const [oldColor, newColor] of Object.entries(COLOR_MIGRATIONS)) {
      const colorPattern = new RegExp(`\\b${oldColor}\\b`, 'g');
      if (colorPattern.test(content)) {
        content = content.replace(colorPattern, newColor);
        hasChanges = true;
      }
    }

    // 4. Save changes
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Migrated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error);
  }
}

async function runMigration(): Promise<void> {
  console.log('🚀 Starting mass UI migration...');
  
  // Find all TypeScript/React files excluding UI components themselves
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: [
      'src/components/ui/**',
      'src/scripts/**',
      'src/utils/migration-helpers.ts'
    ]
  });

  console.log(`📁 Found ${files.length} files to migrate`);

  // Process files in batches
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(migrateFile));
  }

  console.log('✨ Mass migration complete!');
}

// Export for manual execution
export { runMigration, migrateFile };

// Run if executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}