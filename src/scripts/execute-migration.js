/**
 * Execute the complete migration
 */

import { execSync } from 'child_process';

try {
  console.log('🚀 Executing complete UI migration...');
  
  execSync('npx tsx src/scripts/run-complete-migration.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✨ Migration execution completed!');
  
} catch (error) {
  console.error('❌ Migration execution failed:', error.message);
  process.exit(1);
}