import React from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Permission } from '@/utils/rolePermissions';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';
import { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface SecureQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  fallbackData?: T;
  bypassAuth?: boolean; // For public data
}

interface SecureMutationOptions<T, V> extends Omit<UseMutationOptions<T, Error, V>, 'mutationFn'> {
  mutationFn: (variables: V) => Promise<T>;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  invalidateQueries?: string[];
  bypassAuth?: boolean;
}

/**
 * Secure query hook that enforces role-based access control
 * Ensures database queries respect user permissions
 */
export function useSecureQuery<T>(options: SecureQueryOptions<T>) {
  const { user, session } = useAuth();
  const rolePermissions = useRolePermissions();

  const {
    queryFn,
    requiredPermission,
    requiredPermissions,
    requireAllPermissions = false,
    fallbackData,
    bypassAuth = false,
    ...queryOptions
  } = options;

  // Check if user has required permissions
  const hasPermission = React.useMemo(() => {
    if (bypassAuth) return true;
    if (!user || !session) return false;

    if (requiredPermission) {
      return rolePermissions.hasPermission(requiredPermission);
    }

    if (requiredPermissions) {
      return requireAllPermissions
        ? rolePermissions.hasAllPermissions(requiredPermissions)
        : rolePermissions.hasAnyPermission(requiredPermissions);
    }

    return true; // No specific permission required
  }, [
    bypassAuth,
    user,
    session,
    requiredPermission,
    requiredPermissions,
    requireAllPermissions,
    rolePermissions
  ]);

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!hasPermission) {
        // Log unauthorized access attempt
        log.warn('Unauthorized query attempt blocked', {
          userId: user?.id,
          userRole: rolePermissions.userRole,
          requiredPermission,
          requiredPermissions,
          queryKey: queryOptions.queryKey
        }, 'SecureQuery');

        if (fallbackData !== undefined) {
          return fallbackData;
        }
        
        throw new Error('Insufficient permissions to access this data');
      }

      try {
        const result = await queryFn();
        
        // Log successful data access
        log.debug('Secure query executed successfully', {
          userId: user?.id,
          userRole: rolePermissions.userRole,
          queryKey: queryOptions.queryKey
        }, 'SecureQuery');
        
        return result;
      } catch (error) {
        // Log query error
        log.error('Secure query failed', {
          error,
          userId: user?.id,
          userRole: rolePermissions.userRole,
          queryKey: queryOptions.queryKey
        }, 'SecureQuery');
        
        throw error;
      }
    },
    enabled: hasPermission && (queryOptions.enabled !== false)
  });
}

/**
 * Secure mutation hook that enforces role-based access control
 * Ensures database mutations respect user permissions
 */
export function useSecureMutation<T, V>(options: SecureMutationOptions<T, V>) {
  const { user, session } = useAuth();
  const rolePermissions = useRolePermissions();
  const queryClient = useQueryClient();

  const {
    mutationFn,
    requiredPermission,
    requiredPermissions,
    requireAllPermissions = false,
    invalidateQueries = [],
    bypassAuth = false,
    onSuccess,
    onError,
    ...mutationOptions
  } = options;

  return useMutation({
    ...mutationOptions,
    mutationFn: async (variables: V) => {
      // Check permissions at mutation time (more secure than at hook creation)
      const hasPermission = (() => {
        if (bypassAuth) return true;
        if (!user || !session) return false;

        if (requiredPermission) {
          return rolePermissions.hasPermission(requiredPermission);
        }

        if (requiredPermissions) {
          return requireAllPermissions
            ? rolePermissions.hasAllPermissions(requiredPermissions)
            : rolePermissions.hasAnyPermission(requiredPermissions);
        }

        return true;
      })();

      if (!hasPermission) {
        // Log unauthorized mutation attempt
        log.warn('Unauthorized mutation attempt blocked', {
          userId: user?.id,
          userRole: rolePermissions.userRole,
          requiredPermission,
          requiredPermissions,
          variables
        }, 'SecureMutation');

        throw new Error('Insufficient permissions to perform this action');
      }

      try {
        const result = await mutationFn(variables);
        
        // Log successful mutation
        log.info('Secure mutation executed successfully', {
          userId: user?.id,
          userRole: rolePermissions.userRole,
          mutationType: mutationOptions.mutationKey?.[0] || 'unknown'
        }, 'SecureMutation');
        
        return result;
      } catch (error) {
        // Log mutation error
        log.error('Secure mutation failed', {
          error,
          userId: user?.id,
          userRole: rolePermissions.userRole,
          variables
        }, 'SecureMutation');
        
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate specified queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Call original onSuccess if provided
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Enhanced error logging
      log.error('Mutation error in useSecureMutation', {
        error: error.message,
        userId: user?.id,
        userRole: rolePermissions.userRole,
        variables
      }, 'SecureMutation');

      // Call original onError if provided
      onError?.(error, variables, context);
    }
  });
}

/**
 * Helper function to create RLS-aware Supabase queries
 */
export function createSecureSupabaseQuery<T>(
  tableName: TableName,
  selectQuery: string = '*',
  additionalFilters?: (query: any) => any
) {
  return async (): Promise<T> => {
    let query = supabase.from(tableName).select(selectQuery);
    
    if (additionalFilters) {
      query = additionalFilters(query);
    }

    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data as T;
  };
}

/**
 * Helper function to create secure query functions for specific tables
 */
export function createTableQuery<T>(
  tableName: TableName,
  selectQuery?: string,
  filters?: (query: any) => any
) {
  return createSecureSupabaseQuery<T>(tableName, selectQuery, filters);
}

/**
 * Helper function to create secure mutation functions
 * Uses proper typing but simplified implementation to avoid complex generics
 */
export function createSecureMutation<T>(
  mutationFn: () => Promise<T>
) {
  return mutationFn;
}