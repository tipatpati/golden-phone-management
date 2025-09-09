import { useState, useEffect, useCallback } from 'react';
import { Services } from '@/services/core';
import type { BarcodeService } from '@/services/shared/BarcodeService';

/**
 * React hook for accessing the injectable barcode service
 * Provides a clean interface for components to use barcode functionality
 */
export function useBarcodeService() {
  const [service, setService] = useState<BarcodeService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      try {
        const barcodeService = await Services.getBarcodeService();
        if (mounted) {
          setService(barcodeService);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize barcode service');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeService();

    return () => {
      mounted = false;
    };
  }, []);

  const generateUnitBarcode = useCallback(async (unitId: string, options?: any) => {
    if (!service) throw new Error('Service not available');
    return await service.generateUnitBarcode(unitId, options);
  }, [service]);

  const generateProductBarcode = useCallback(async (productId: string, options?: any) => {
    if (!service) throw new Error('Service not available');
    return await service.generateProductBarcode(productId, options);
  }, [service]);

  const validateBarcode = useCallback(async (barcode: string) => {
    if (!service) return { isValid: false, errors: ['Service not available'] };
    return await service.validateBarcode(barcode);
  }, [service]);

  return {
    service,
    isLoading,
    error,
    isReady: service !== null && !isLoading && !error,
    generateUnitBarcode,
    generateProductBarcode,
    validateBarcode
  };
}