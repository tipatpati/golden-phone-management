/**
 * Run the service migration script
 * This script migrates all legacy service imports to the new injectable system
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  console.log('🚀 Starting service import migration...');
  
  // Run the TypeScript migration script
  execSync(`npx tsx ${join(__dirname, 'migrate-service-imports.ts')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✨ Migration completed successfully!');
  console.log('📝 Please review the changes and test the application');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}