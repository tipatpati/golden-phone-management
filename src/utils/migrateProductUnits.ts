import { ProductUnitsService } from "@/services/products/ProductUnitsService";

/**
 * Utility to migrate existing product units by re-parsing their serial numbers
 * This fixes the issue where storage and RAM are null for existing units
 */
export async function migrateExistingProductUnits(): Promise<void> {
  console.log('Starting product units migration...');
  
  try {
    const result = await ProductUnitsService.updateExistingUnitsWithParsedData();
    
    if (result.updated > 0) {
      console.log(`✅ Migration successful: Updated ${result.updated} product units`);
      if (result.errors > 0) {
        console.warn(`⚠️ ${result.errors} errors occurred during migration`);
      }
    } else {
      console.log('ℹ️ No units needed updating - all units already have storage/RAM data');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Auto-run migration in development mode
if (import.meta.env.DEV) {
  // Run migration after a short delay to ensure app is initialized
  setTimeout(() => {
    migrateExistingProductUnits().catch(console.error);
  }, 2000);
}