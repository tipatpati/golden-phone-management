import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/roles/RoleService';
import { UserRole } from '@/types/roles';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export function useCurrentUserRole() {
  const { user } = useAuth();
  
  console.log('🔑 useCurrentUserRole called with user:', user?.id);
  
  return useQuery({
    queryKey: ['currentUserRole', user?.id],
    queryFn: async () => {
      console.log('🔄 Fetching role for user:', user?.id);
      if (!user?.id) {
        console.log('❌ No user ID, returning null');
        return null;
      }
      const result = await roleService.getCurrentUserRole();
      console.log('📋 Role fetch result:', result);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once to prevent infinite loops
    retryDelay: 1000, // 1 second delay
  });
}

export function useUserProfile(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['userProfile', targetUserId],
    queryFn: () => targetUserId ? roleService.getUserProfile(targetUserId) : null,
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useHasRole(role: UserRole) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['hasRole', user?.id, role],
    queryFn: () => user?.id ? roleService.hasRole(user.id, role) : false,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUserRoles(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['userRoles', targetUserId],
    queryFn: () => targetUserId ? roleService.getUserRoles(targetUserId) : [],
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ targetUserId, newRole }: { targetUserId: string; newRole: UserRole }) =>
      roleService.updateUserRole(targetUserId, newRole),
    onSuccess: (data, variables) => {
      // Invalidate all role-related queries
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['hasRole'] });
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      
      // If updating current user, also update auth context
      if (variables.targetUserId === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
      
      toast.success(`Role updated to ${variables.newRole}`);
    },
    onError: (error: any) => {
      toast.error('Failed to update role', {
        description: error.message || 'Only admins can change user roles'
      });
    }
  });
}