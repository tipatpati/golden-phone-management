/**
 * Store Helper Utilities
 * Provides helper functions to automatically inject store_id into data operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Get the current store ID from the database session
 * This calls the Supabase RPC function that retrieves the store from session variable
 */
export async function getCurrentStoreId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_current_store_id');
    
    if (error) {
      logger.error('Failed to get current store ID', { error }, 'storeHelpers');
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error('Error getting current store ID', { error }, 'storeHelpers');
    return null;
  }
}

/**
 * Inject store_id into data object for create operations
 * If data already has store_id, it won't be overridden
 */
export async function withStoreId<T extends Record<string, any>>(
  data: T
): Promise<T & { store_id: string }> {
  // If store_id already exists, return as is
  if ('store_id' in data && data.store_id) {
    return data as T & { store_id: string };
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    throw new Error(
      'No store context set. Please select a store from the header menu before performing this operation. ' +
      'If you don\'t see a store selector, contact your administrator to assign you to a store.'
    );
  }

  return {
    ...data,
    store_id: storeId,
  };
}

/**
 * Inject store_id into array of data objects
 */
export async function withStoreIdBatch<T extends Record<string, any>>(
  dataArray: T[]
): Promise<Array<T & { store_id: string }>> {
  const storeId = await getCurrentStoreId();
  
  if (!storeId) {
    throw new Error('No store assigned to current user. Please contact administrator.');
  }
  
  return dataArray.map(data => ({
    ...data,
    store_id: data.store_id || storeId,
  }));
}

/**
 * Check if current user has access to a specific store
 */
export async function checkStoreAccess(storeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('user_has_store_access', {
      target_store_id: storeId
    });
    
    if (error) {
      logger.error('Failed to check store access', { error, storeId }, 'storeHelpers');
      return false;
    }
    
    return data === true;
  } catch (error) {
    logger.error('Error checking store access', { error, storeId }, 'storeHelpers');
    return false;
  }
}

/**
 * Assign current user to a store and set it as default
 */
export async function assignUserToStore(storeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  // Unset default for all other stores
  await supabase
    .from('user_stores')
    .update({ is_default: false })
    .eq('user_id', user.id);

  // Insert or update the store assignment
  const { error } = await supabase
    .from('user_stores')
    .upsert({
      user_id: user.id,
      store_id: storeId,
      is_default: true
    }, {
      onConflict: 'user_id,store_id'
    });

  if (error) throw error;

  // Set current store in session
  await supabase.rpc('set_user_current_store', {
    target_store_id: storeId
  });

  logger.info('User assigned to store', { storeId }, 'storeHelpers');
}
