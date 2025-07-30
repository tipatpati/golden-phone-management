import { useState, useEffect } from 'react';
import { getService, serviceLoaders, serviceRegistry } from '@/services/core/ServiceRegistry';

// Hook for loading services dynamically
export function useServiceLoader(serviceName: keyof typeof serviceLoaders) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    getService(serviceName)
      .then(loadedService => {
        if (mounted) {
          setService(loadedService);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [serviceName]);

  return { service, loading, error };
}

// Hook for checking if a service is loaded
export function useServiceStatus(serviceName: keyof typeof serviceLoaders) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      // Check if service is already loaded
      const loaded = serviceRegistry.has(serviceName);
      setIsLoaded(loaded);
    };

    checkStatus();
    
    // Check periodically (could be optimized with events)
    const interval = setInterval(checkStatus, 100);
    
    return () => clearInterval(interval);
  }, [serviceName]);

  return isLoaded;
}