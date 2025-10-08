/**
 * Phase 5: Final Component Migration Script
 * Automates the migration of remaining components to enhanced system
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const importMigrations: MigrationRule[] = [
  {
    pattern: /from ["']@\/components\/ui\/dialog["']/g,
    replacement: 'from "@/components/ui/updated-dialog"',
    description: 'Migrate dialog imports'
  },
  {
    pattern: /from ["']@\/components\/ui\/button["']/g,
    replacement: 'from "@/components/ui/updated-button"',
    description: 'Migrate button imports'
  },
  {
    pattern: /from ["']@\/components\/ui\/card["']/g,
    replacement: 'from "@/components/ui/updated-card"',
    description: 'Migrate card imports'
  },
  {
    pattern: /from ["']@\/components\/ui\/updated-dialog["']/g,
    replacement: 'from "@/components/ui/enhanced-dialog"',
    description: 'Remove updated-dialog wrappers'
  },
  {
    pattern: /from ["']@\/components\/ui\/updated-button["']/g,
    replacement: 'from "@/components/ui/enhanced-button"',
    description: 'Remove updated-button wrappers'
  },
  {
    pattern: /from ["']@\/components\/ui\/updated-card["']/g,
    replacement: 'from "@/components/ui/enhanced-card"',
    description: 'Remove updated-card wrappers'
  }
];

const variantMigrations: MigrationRule[] = [
  {
    pattern: /(<Button[^>]*variant=["'])outline(["'][^>]*>)/g,
    replacement: '$1outlined$2',
    description: 'Button: outline → outlined'
  },
  {
    pattern: /(<Button[^>]*variant=["'])ghost(["'][^>]*>)/g,
    replacement: '$1text$2',
    description: 'Button: ghost → text'
  },
  {
    pattern: /(<Button[^>]*variant=["'])default(["'][^>]*>)/g,
    replacement: '$1filled$2',
    description: 'Button: default → filled'
  }
];

const dialogSizeMigrations: MigrationRule[] = [
  {
    pattern: /className=["']([^"']*)max-w-md([^"']*)["']/g,
    replacement: 'size="sm" className="$1$2"',
    description: 'Dialog: max-w-md → size="sm"'
  },
  {
    pattern: /className=["']([^"']*)max-w-lg([^"']*)["']/g,
    replacement: 'size="md" className="$1$2"',
    description: 'Dialog: max-w-lg → size="md"'
  },
  {
    pattern: /className=["']([^"']*)max-w-xl([^"']*)["']/g,
    replacement: 'size="md" className="$1$2"',
    description: 'Dialog: max-w-xl → size="md"'
  },
  {
    pattern: /className=["']([^"']*)max-w-2xl([^"']*)["']/g,
    replacement: 'size="md" className="$1$2"',
    description: 'Dialog: max-w-2xl → size="md"'
  },
  {
    pattern: /className=["']([^"']*)max-w-3xl([^"']*)["']/g,
    replacement: 'size="lg" className="$1$2"',
    description: 'Dialog: max-w-3xl → size="lg"'
  },
  {
    pattern: /className=["']([^"']*)max-w-4xl([^"']*)["']/g,
    replacement: 'size="lg" className="$1$2"',
    description: 'Dialog: max-w-4xl → size="lg"'
  }
];

async function migrateFile(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let hasChanges = false;

    // Skip badge components for variant migrations
    const isBadgeFile = content.includes('Badge') && filePath.includes('badge');
    
    // Apply import migrations
    for (const rule of importMigrations) {
      if (rule.pattern.test(content)) {
        content = content.replace(rule.pattern, rule.replacement);
        hasChanges = true;
      }
    }

    // Apply variant migrations (skip badges)
    if (!isBadgeFile) {
      for (const rule of variantMigrations) {
        if (rule.pattern.test(content)) {
          content = content.replace(rule.pattern, rule.replacement);
          hasChanges = true;
        }
      }
    }

    // Apply dialog size migrations
    for (const rule of dialogSizeMigrations) {
      if (rule.pattern.test(content)) {
        content = content.replace(rule.pattern, rule.replacement);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error migrating ${filePath}:`, error);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Starting Phase 5 Migration...\n');

  const patterns = [
    'src/components/**/*.tsx',
    'src/pages/**/*.tsx',
    'src/services/**/*.tsx',
  ];

  let totalFiles = 0;
  let migratedFiles = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**'] });
    
    for (const file of files) {
      totalFiles++;
      const migrated = await migrateFile(file);
      if (migrated) {
        migratedFiles++;
        console.log(`✅ Migrated: ${file}`);
      }
    }
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Total files processed: ${totalFiles}`);
  console.log(`📝 Files migrated: ${migratedFiles}`);
  console.log(`✅ Files unchanged: ${totalFiles - migratedFiles}`);
}

runMigration().catch(console.error);
