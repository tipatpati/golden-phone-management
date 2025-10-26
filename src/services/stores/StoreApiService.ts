import { supabase } from '@/integrations/supabase/client';
import type { Store, CreateStoreData, UpdateStoreData, UserStore, AssignUserToStoreData } from './types';

export class StoreApiService {
  protected tableName = 'stores';

  /**
   * Get all stores (respects RLS - super admins see all, users see assigned stores)
   */
  async getAll(): Promise<Store[]> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch stores: ${error.message}`);
    }

    return (data || []) as unknown as Store[];
  }

  /**
   * Get active stores only
   */
  async getActiveStores(): Promise<Store[]> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active stores: ${error.message}`);
    }

    return (data || []) as unknown as Store[];
  }

  /**
   * Get store by ID
   */
  async getById(id: string): Promise<Store> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch store: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Store with ID ${id} not found`);
    }

    return data as unknown as Store;
  }

  /**
   * Get store by code
   */
  async getByCode(code: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch store by code: ${error.message}`);
    }

    return data ? (data as unknown as Store) : null;
  }

  /**
   * Create a new store (super admin only)
   */
  async create(data: CreateStoreData): Promise<Store> {
    const { data: store, error } = await supabase
      .from(this.tableName as any)
      .insert({
        ...data,
        code: data.code.toUpperCase(), // Enforce uppercase
        is_active: data.is_active ?? true,
        settings: data.settings ?? {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create store: ${error.message}`);
    }

    return store as unknown as Store;
  }

  /**
   * Update a store (super admin only)
   */
  async update(data: UpdateStoreData): Promise<Store> {
    const { id, ...updateData } = data;

    const { data: store, error } = await supabase
      .from(this.tableName as any)
      .update({
        ...updateData,
        ...(updateData.code && { code: updateData.code.toUpperCase() }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update store: ${error.message}`);
    }

    return store as unknown as Store;
  }

  /**
   * Soft delete a store (set is_active to false)
   */
  async deactivate(id: string): Promise<Store> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to deactivate store: ${error.message}`);
    }

    return data as unknown as Store;
  }

  /**
   * Hard delete a store (super admin only, use with caution)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete store: ${error.message}`);
    }
  }

  // ==========================================
  // USER-STORE ASSIGNMENT METHODS
  // ==========================================

  /**
   * Get stores assigned to a user
   */
  async getUserStores(userId: string): Promise<UserStore[]> {
    const { data, error } = await supabase
      .from('user_stores')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user stores: ${error.message}`);
    }

    return (data || []) as unknown as UserStore[];
  }

  /**
   * Get current user's stores
   */
  async getCurrentUserStores(): Promise<UserStore[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    return this.getUserStores(user.id);
  }

  /**
   * Get user's default store
   */
  async getUserDefaultStore(userId: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('user_stores')
      .select(`
        store:stores(*)
      `)
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch default store: ${error.message}`);
    }

    return data?.store ? (data.store as unknown as Store) : null;
  }

  /**
   * Assign user to a store
   */
  async assignUserToStore(data: AssignUserToStoreData): Promise<UserStore> {
    // If setting as default, unset other defaults first
    if (data.is_default) {
      await supabase
        .from('user_stores')
        .update({ is_default: false })
        .eq('user_id', data.user_id);
    }

    const { data: assignment, error } = await supabase
      .from('user_stores')
      .insert({
        user_id: data.user_id,
        store_id: data.store_id,
        is_default: data.is_default ?? false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign user to store: ${error.message}`);
    }

    return assignment as unknown as UserStore;
  }

  /**
   * Remove user from a store
   */
  async removeUserFromStore(userId: string, storeId: string): Promise<void> {
    const { error } = await supabase
      .from('user_stores')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId);

    if (error) {
      throw new Error(`Failed to remove user from store: ${error.message}`);
    }
  }

  /**
   * Set user's default store
   */
  async setDefaultStore(userId: string, storeId: string): Promise<void> {
    // Unset all defaults
    await supabase
      .from('user_stores')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    const { error } = await supabase
      .from('user_stores')
      .update({ is_default: true })
      .eq('user_id', userId)
      .eq('store_id', storeId);

    if (error) {
      throw new Error(`Failed to set default store: ${error.message}`);
    }
  }

  /**
   * Set current store in session (calls database function)
   */
  async setCurrentStore(storeId: string): Promise<void> {
    const { error } = await supabase.rpc('set_user_current_store', {
      target_store_id: storeId
    });

    if (error) {
      throw new Error(`Failed to set current store: ${error.message}`);
    }
  }
}

export const storeApiService = new StoreApiService();
