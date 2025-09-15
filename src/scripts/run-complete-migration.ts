/**
 * Complete UI Migration - Phases 3-4
 * Runs mass migration and verifies results
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Import migration patterns
import { 
  UI_COMPONENT_MIGRATIONS,
  BUTTON_VARIANT_MIGRATIONS,
  COLOR_CLASS_MIGRATIONS,
  TYPOGRAPHY_MIGRATIONS,
  SPACING_MIGRATIONS,
  DIALOG_SIZE_MIGRATIONS,
  REMOVE_CUSTOM_CLASSES 
} from './migrate-ui-components';

async function migrateFile(filePath: string): Promise<boolean> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    // Skip if already using updated components
    if (content.includes('@/components/ui/updated-')) {
      return false;
    }

    // 1. Migrate component imports
    for (const [oldImport, newImport] of Object.entries(UI_COMPONENT_MIGRATIONS)) {
      const oldPattern = new RegExp(`from ['"]${oldImport.replace(/[/]/g, '\\/')}['"]`, 'g');
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, `from '${newImport}'`);
        hasChanges = true;
      }
    }

    // 2. Migrate button variants
    for (const [oldVariant, newVariant] of Object.entries(BUTTON_VARIANT_MIGRATIONS)) {
      const variantPattern = new RegExp(`variant=["']${oldVariant}["']`, 'g');
      if (variantPattern.test(content)) {
        content = content.replace(variantPattern, `variant="${newVariant}"`);
        hasChanges = true;
      }
    }

    // 3. Migrate color classes
    for (const [oldColor, newColor] of Object.entries(COLOR_CLASS_MIGRATIONS)) {
      const colorPattern = new RegExp(`\\b${oldColor}\\b`, 'g');
      if (colorPattern.test(content)) {
        content = content.replace(colorPattern, newColor);
        hasChanges = true;
      }
    }

    // 4. Migrate typography
    for (const [oldType, newType] of Object.entries(TYPOGRAPHY_MIGRATIONS)) {
      const typePattern = new RegExp(`\\b${oldType}\\b`, 'g');
      if (typePattern.test(content)) {
        content = content.replace(typePattern, newType);
        hasChanges = true;
      }
    }

    // 5. Migrate spacing
    for (const [oldSpacing, newSpacing] of Object.entries(SPACING_MIGRATIONS)) {
      const spacingPattern = new RegExp(`\\b${oldSpacing}\\b`, 'g');
      if (spacingPattern.test(content)) {
        content = content.replace(spacingPattern, newSpacing);
        hasChanges = true;
      }
    }

    // 6. Save changes
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

async function runPhase3(): Promise<void> {
  console.log('🚀 Phase 3: Mass Component Migration');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: [
      'src/components/ui/**',
      'src/scripts/**',
    ]
  });

  console.log(`📁 Found ${files.length} files to migrate`);
  
  let migratedCount = 0;
  for (const file of files) {
    if (await migrateFile(file)) {
      migratedCount++;
    }
  }
  
  console.log(`✨ Phase 3 complete: ${migratedCount} files migrated`);
}

async function runPhase4(): Promise<void> {
  console.log('🔍 Phase 4: Final Verification');
  
  // Check for remaining legacy imports
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['src/components/ui/**', 'src/scripts/**']
  });
  
  let legacyImports = 0;
  let hardcodedColors = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for legacy component imports
    if (content.match(/from ['"]@\/components\/ui\/(dialog|card|button)['"]/) && 
        !content.includes('@/components/ui/updated-')) {
      legacyImports++;
    }
    
    // Check for hardcoded colors
    if (content.match(/\b(text-white|text-black|bg-white|bg-black|text-gray-)\b/)) {
      hardcodedColors++;
    }
  }
  
  console.log(`📊 Migration Results:`);
  console.log(`   - Files with legacy imports: ${legacyImports}`);
  console.log(`   - Files with hardcoded colors: ${hardcodedColors}`);
  
  if (legacyImports === 0 && hardcodedColors === 0) {
    console.log('🎉 Migration 100% complete!');
  } else {
    console.log('⚠️  Manual review needed for remaining issues');
  }
}

async function runCompleteMigration(): Promise<void> {
  console.log('🚀 Starting Complete UI Migration - Phases 3-4');
  
  await runPhase3();
  await runPhase4();
  
  console.log('✨ Complete migration finished!');
}

// Export for manual execution
export { runCompleteMigration, runPhase3, runPhase4 };

// Run if executed directly
if (require.main === module) {
  runCompleteMigration().catch(console.error);
}