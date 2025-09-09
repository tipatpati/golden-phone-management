/**
 * Migration script to update service imports across the codebase
 * Run this to transition from static to injectable services
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const MIGRATION_PATTERNS = [
  // Barcode services
  {
    from: /import\s+{\s*Code128GeneratorService\s*}\s+from\s+['"]@\/services\/barcodes['"];?/g,
    to: `import { Services } from '@/services/core';`
  },
  {
    from: /import\s+{\s*BarcodeRegistryService\s*}\s+from\s+['"]@\/services\/barcodes['"];?/g,
    to: `import { Services } from '@/services/core';`
  },
  {
    from: /import\s+{\s*Code128GeneratorService,\s*BarcodeRegistryService\s*}\s+from\s+['"]@\/services\/barcodes['"];?/g,
    to: `import { Services } from '@/services/core';`
  },
  
  // Thermal label service
  {
    from: /import\s+{\s*ThermalLabelService\s*}\s+from\s+['"].*ThermalLabelService['"];?/g,
    to: `import { Services } from '@/services/core';`
  },
  
  // Usage patterns
  {
    from: /Code128GeneratorService\.validateCode128/g,
    to: `(await Services.getBarcodeService()).validateBarcode`
  },
  {
    from: /Code128GeneratorService\.generateUnitBarcode/g,
    to: `(await Services.getBarcodeService()).generateUnitBarcode`
  },
  {
    from: /Code128GeneratorService\.generateProductBarcode/g,
    to: `(await Services.getBarcodeService()).generateProductBarcode`
  },
  {
    from: /Code128GeneratorService\.getOrGenerateUnitBarcode/g,
    to: `(await Services.getBarcodeService()).getOrGenerateBarcode`
  },
  {
    from: /Code128GeneratorService\.generateBulkUnitBarcodes/g,
    to: `(await Services.getBarcodeService()).generateBulkBarcodes`
  },
  {
    from: /Code128GeneratorService\.parseBarcodeInfo/g,
    to: `(await Services.getBarcodeService()).parseBarcode`
  },
  
  // Registry patterns
  {
    from: /BarcodeRegistryService\.generateUniqueBarcode/g,
    to: `(await Services.getBarcodeService()).generateUnitBarcode`
  },
  {
    from: /BarcodeRegistryService\.registerBarcode/g,
    to: `(await Services.getBarcodeService()).registerBarcode`
  },
  {
    from: /BarcodeRegistryService\.getBarcodeByEntity/g,
    to: `(await Services.getBarcodeService()).getBarcodeByEntity`
  },
  {
    from: /BarcodeRegistryService\.validateBarcodeUniqueness/g,
    to: `(await Services.getBarcodeService()).validateUniqueness`
  },
  {
    from: /BarcodeRegistryService\.getBarcodeHistory/g,
    to: `(await Services.getBarcodeService()).getBarcodeHistory`
  },
  
  // Thermal label patterns
  {
    from: /ThermalLabelService\.generateThermalLabels/g,
    to: `(await Services.getPrintService()).generateLabelHTML`
  },
  {
    from: /ThermalLabelService\.printLabels/g,
    to: `(await Services.getPrintService()).printLabels`
  }
];

function migrateFile(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    // Skip if already migrated
    if (content.includes("import { Services } from '@/services/core'")) {
      return false;
    }
    
    for (const pattern of MIGRATION_PATTERNS) {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Migrated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error);
    return false;
  }
}

function scanDirectory(dirPath: string): void {
  const files = readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = join(dirPath, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip type definition files
      if (!file.endsWith('.d.ts')) {
        migrateFile(fullPath);
      }
    }
  }
}

// Run migration
console.log('🚀 Starting service import migration...');
console.log('📁 Scanning src directory for files to migrate...');

scanDirectory('./src');

console.log('✨ Migration completed!');
console.log('📝 Note: You may need to manually adjust function calls that now return Promises');
console.log('🔍 Review changes and test thoroughly before committing');