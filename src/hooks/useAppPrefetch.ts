import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Prefetch data based on route patterns
export function useAppPrefetch() {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    // Prefetch common data on app load
    const prefetchCommonData = async () => {
      // Prefetch user profile (likely to be needed everywhere)
      queryClient.prefetchQuery({
        queryKey: ['profile'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          
          const { data } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', user.id)
            .single();
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    };

    prefetchCommonData();
  }, [queryClient]);

  useEffect(() => {
    // Route-specific prefetching
    const path = location.pathname;

    // Prefetch based on current route to prepare for likely next navigation
    switch (path) {
      case '/':
      case '/dashboard':
        // On dashboard, prefetch sales and repair data
        queryClient.prefetchQuery({
          queryKey: ['sales'],
          staleTime: 5 * 60 * 1000,
        });
        queryClient.prefetchQuery({
          queryKey: ['repairs'],
          staleTime: 5 * 60 * 1000,
        });
        break;

      case '/sales':
        // On sales page, prefetch clients and products
        queryClient.prefetchQuery({
          queryKey: ['clients'],
          staleTime: 10 * 60 * 1000,
        });
        queryClient.prefetchQuery({
          queryKey: ['products'],
          staleTime: 10 * 60 * 1000,
        });
        break;

      case '/inventory':
        // On inventory page, prefetch categories
        queryClient.prefetchQuery({
          queryKey: ['categories'],
          staleTime: 30 * 60 * 1000, // Categories change less frequently
        });
        break;

      case '/repairs':
        // On repairs page, prefetch clients and products for parts
        queryClient.prefetchQuery({
          queryKey: ['clients'],
          staleTime: 10 * 60 * 1000,
        });
        queryClient.prefetchQuery({
          queryKey: ['products'],
          staleTime: 10 * 60 * 1000,
        });
        break;
    }
  }, [location.pathname, queryClient]);

  // Hover prefetching for navigation links
  const prefetchOnHover = (route: string) => {
    switch (route) {
      case '/sales':
        queryClient.prefetchQuery({ queryKey: ['sales'], staleTime: 5 * 60 * 1000 });
        queryClient.prefetchQuery({ queryKey: ['clients'], staleTime: 10 * 60 * 1000 });
        break;
      case '/clients':
        queryClient.prefetchQuery({ queryKey: ['clients'], staleTime: 10 * 60 * 1000 });
        break;
      case '/inventory':
        queryClient.prefetchQuery({ queryKey: ['products'], staleTime: 10 * 60 * 1000 });
        break;
      case '/repairs':
        queryClient.prefetchQuery({ queryKey: ['repairs'], staleTime: 5 * 60 * 1000 });
        break;
    }
  };

  return { prefetchOnHover };
}