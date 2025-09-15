/**
 * Run the mass UI migration script
 * This script migrates all legacy UI imports to the new enhanced system
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  console.log('🚀 Starting mass UI migration...');
  
  // Run the TypeScript migration script
  execSync(`npx tsx ${join(__dirname, 'mass-ui-migration.ts')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✨ Mass UI migration completed successfully!');
  console.log('📝 Please review the changes and test the application');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}