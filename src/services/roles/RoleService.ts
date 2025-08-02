import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/roles';
import { logger } from '@/utils/logger';

export class RoleService {
  private static instance: RoleService;
  
  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  // Get user's current role from user_roles table (authoritative source)
  async getCurrentUserRole(userId?: string): Promise<UserRole | null> {
    try {
      // get_current_user_role() uses auth.uid() internally, so no parameters needed
      const { data, error } = await supabase.rpc('get_current_user_role');
      
      if (error) {
        logger.error('Failed to get current user role', error);
        return null;
      }
      
      return data as UserRole;
    } catch (error) {
      logger.error('Error getting current user role', error);
      return null;
    }
  }

  // Get user's profile including role (for compatibility)
  async getUserProfile(userId: string): Promise<{ username: string | null; role: UserRole } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to get user profile', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error getting user profile', error);
      return null;
    }
  }

  // Update user role (admin function)
  async updateUserRole(targetUserId: string, newRole: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: targetUserId,
        new_role: newRole
      });

      if (error) {
        logger.error('Failed to update user role', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error updating user role', error);
      throw error;
    }
  }

  // Check if user has specific role
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: role
      });

      if (error) {
        logger.error('Failed to check user role', error);
        return false;
      }

      return data;
    } catch (error) {
      logger.error('Error checking user role', error);
      return false;
    }
  }

  // Get all roles for a user
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        _user_id: userId
      });

      if (error) {
        logger.error('Failed to get user roles', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting user roles', error);
      return [];
    }
  }
}

export const roleService = RoleService.getInstance();