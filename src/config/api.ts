/**
 * Centralized API configuration to eliminate hardcoded endpoints
 */

import { env } from './environment';

export const apiConfig = {
  // Supabase endpoints
  supabase: {
    url: env.SUPABASE_URL,
    key: env.SUPABASE_ANON_KEY,
    functionsUrl: `${env.SUPABASE_URL}/functions/v1`,
  },
  
  // Edge function endpoints
  functions: {
    productBulkOperations: `${env.SUPABASE_URL}/functions/v1/product-bulk-operations`,
    captureAndConvert: `${env.SUPABASE_URL}/functions/v1/capture-and-convert`,
  },
  
  // Request defaults
  defaults: {
    timeout: env.IS_PRODUCTION ? 10000 : 30000,
    retries: env.IS_PRODUCTION ? 3 : 1,
  }
};

/**
 * Create authenticated headers for API requests
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create form data headers for file uploads
 */
export function createFormHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export default apiConfig;