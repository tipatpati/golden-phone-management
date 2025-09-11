import { useState, useEffect, useCallback } from 'react';
import { Services } from '@/services/core/Services';
import type { BarcodeAuthorityService } from '@/services/core/BarcodeAuthorityService';

/**
 * React hook for accessing the barcode authority service (single source of truth)
 * Provides a clean interface for components to use barcode functionality
 */
export function useBarcodeService() {
  const [service, setService] = useState<BarcodeAuthorityService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      try {
        // Use BarcodeAuthority as single source of truth
        const barcodeAuthority = Services.getBarcodeAuthority();
        if (mounted) {
          setService(barcodeAuthority);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize barcode authority');
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

  const validateBarcode = useCallback((barcode: string) => {
    if (!service) return { isValid: false, errors: ['Service not available'] };
    return service.validateBarcode(barcode);
  }, [service]);

  const verifyBarcodeIntegrity = useCallback((barcode: string, expectedSource?: string) => {
    if (!service) return false;
    return service.verifyBarcodeIntegrity(barcode, expectedSource);
  }, [service]);

  return {
    service,
    isLoading,
    error,
    isReady: service !== null && !isLoading && !error,
    generateUnitBarcode,
    generateProductBarcode,
    validateBarcode,
    verifyBarcodeIntegrity
  };
}