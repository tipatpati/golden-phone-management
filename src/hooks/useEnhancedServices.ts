/**
 * React Hook for Enhanced Service Management
 * Provides easy access to services with React integration
 */

import { useState, useEffect, useCallback } from 'react';
import { Services } from '@/services/core';
import type { BarcodeService } from '@/services/shared/BarcodeService';
import type { PrintService } from '@/services/shared/PrintService';
import type { ServiceCategory } from '@/services/core/SharedServiceRegistry';

interface ServiceState<T> {
  service: T | null;
  loading: boolean;
  error: Error | null;
  healthy: boolean;
}

/**
 * Hook for accessing shared services
 */
export function useService<T>(serviceName: string) {
  const [state, setState] = useState<ServiceState<T>>({
    service: null,
    loading: true,
    error: null,
    healthy: false
  });

  useEffect(() => {
    let mounted = true;

    const loadService = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const service = await Services.get<T>(serviceName);
        const healthy = await Services.isHealthy(serviceName);
        
        if (mounted) {
          setState({
            service,
            loading: false,
            error: null,
            healthy
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            service: null,
            loading: false,
            error: error as Error,
            healthy: false
          });
        }
      }
    };

    loadService();

    return () => {
      mounted = false;
    };
  }, [serviceName]);

  const reload = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const service = await Services.get<T>(serviceName);
      const healthy = await Services.isHealthy(serviceName);
      
      setState({
        service,
        loading: false,
        error: null,
        healthy
      });
    } catch (error) {
      setState({
        service: null,
        loading: false,
        error: error as Error,
        healthy: false
      });
    }
  }, [serviceName]);

  return {
    ...state,
    reload
  };
}

/**
 * Hook for barcode service
 */
export function useBarcodeService() {
  const [state, setState] = useState<ServiceState<BarcodeService>>({
    service: null,
    loading: true,
    error: null,
    healthy: false
  });

  useEffect(() => {
    let mounted = true;

    const loadService = async () => {
      try {
        const service = await Services.getBarcodeService();
        const healthy = await Services.isHealthy('barcodeService');
        
        if (mounted) {
          setState({
            service,
            loading: false,
            error: null,
            healthy
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            service: null,
            loading: false,
            error: error as Error,
            healthy: false
          });
        }
      }
    };

    loadService();

    return () => {
      mounted = false;
    };
  }, []);

  const generateUnitBarcode = useCallback(async (unitId: string, options?: any) => {
    if (!state.service) throw new Error('Barcode service not available');
    return state.service.generateUnitBarcode(unitId, options);
  }, [state.service]);

  const generateProductBarcode = useCallback(async (productId: string, options?: any) => {
    if (!state.service) throw new Error('Barcode service not available');
    return state.service.generateProductBarcode(productId, options);
  }, [state.service]);

  const validateBarcode = useCallback((barcode: string) => {
    if (!state.service) throw new Error('Barcode service not available');
    return state.service.validateBarcode(barcode);
  }, [state.service]);

  return {
    ...state,
    generateUnitBarcode,
    generateProductBarcode,
    validateBarcode
  };
}

/**
 * Hook for print service
 */
export function usePrintService() {
  const [state, setState] = useState<ServiceState<PrintService>>({
    service: null,
    loading: true,
    error: null,
    healthy: false
  });

  useEffect(() => {
    let mounted = true;

    const loadService = async () => {
      try {
        const service = await Services.getPrintService();
        const healthy = await Services.isHealthy('printService');
        
        if (mounted) {
          setState({
            service,
            loading: false,
            error: null,
            healthy
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            service: null,
            loading: false,
            error: error as Error,
            healthy: false
          });
        }
      }
    };

    loadService();

    return () => {
      mounted = false;
    };
  }, []);

  const printLabels = useCallback(async (labels: any[], options: any) => {
    if (!state.service) throw new Error('Print service not available');
    return state.service.printLabels(labels, options);
  }, [state.service]);

  const generateLabelHTML = useCallback((labels: any[], options: any) => {
    if (!state.service) throw new Error('Print service not available');
    return state.service.generateLabelHTML(labels, options);
  }, [state.service]);

  return {
    ...state,
    printLabels,
    generateLabelHTML
  };
}

/**
 * Hook for services by category
 */
export function useServicesByCategory<T>(category: ServiceCategory) {
  const [state, setState] = useState<{
    services: T[];
    loading: boolean;
    error: Error | null;
  }>({
    services: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        const services = await Services.getByCategory<T>(category);
        
        if (mounted) {
          setState({
            services,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            services: [],
            loading: false,
            error: error as Error
          });
        }
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, [category]);

  return state;
}