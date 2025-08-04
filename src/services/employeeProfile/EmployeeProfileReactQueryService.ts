import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeProfileApiService } from './EmployeeProfileApiService';
import { toast } from '@/components/ui/sonner';
import type { CreateEmployeeProfileData, UpdateEmployeeProfileData } from './types';

const employeeProfileService = new EmployeeProfileApiService();

// React Query hooks
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: ['employee-profile', 'current'],
    queryFn: () => employeeProfileService.getCurrentUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['employee-profile', userId],
    queryFn: () => employeeProfileService.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllEmployeeProfiles() {
  return useQuery({
    queryKey: ['employee-profiles', 'all'],
    queryFn: () => employeeProfileService.getAllProfiles(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePerformanceLogs(userId?: string) {
  return useQuery({
    queryKey: ['performance-logs', userId],
    queryFn: () => employeeProfileService.getPerformanceLogs(userId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateEmployeeProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateEmployeeProfileData) => 
      employeeProfileService.createProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employee-profile'] });
      toast.success('Employee profile created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create profile: ${error.message}`);
    },
  });
}

export function useUpdateEmployeeProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, updates }: { profileId: string; updates: UpdateEmployeeProfileData }) =>
      employeeProfileService.updateProfile(profileId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employee-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });
}

// Export service for direct access
export { employeeProfileService };