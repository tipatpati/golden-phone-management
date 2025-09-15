/**
 * Execute comprehensive migration script
 */

import { execSync } from 'child_process';

try {
  console.log('🚀 Executing comprehensive UI and color migration...');
  
  execSync('npx tsx src/scripts/execute-comprehensive-migration.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✨ Comprehensive migration completed successfully!');
  console.log('🎯 All files migrated to enhanced Material Design system');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}