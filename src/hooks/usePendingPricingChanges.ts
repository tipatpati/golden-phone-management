import { useState, useCallback } from 'react';
import type { UnitEntryForm } from '@/services/inventory/types';

export interface PendingPricingChange {
  unitIndex: number;
  originalUnit: UnitEntryForm;
  proposedUnit: UnitEntryForm;
  changeType: 'price' | 'template_applied';
  templateName?: string;
}

export interface PendingPricingState {
  pendingChanges: PendingPricingChange[];
  hasPendingChanges: boolean;
}

export function usePendingPricingChanges() {
  const [pendingChanges, setPendingChanges] = useState<PendingPricingChange[]>([]);

  const hasPendingChanges = pendingChanges.length > 0;

  const addPendingChanges = useCallback((changes: PendingPricingChange[]) => {
    setPendingChanges(prev => {
      // Remove any existing changes for the same units
      const unitIndices = changes.map(c => c.unitIndex);
      const filtered = prev.filter(c => !unitIndices.includes(c.unitIndex));
      return [...filtered, ...changes];
    });
  }, []);

  const removePendingChange = useCallback((unitIndex: number) => {
    setPendingChanges(prev => prev.filter(c => c.unitIndex !== unitIndex));
  }, []);

  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
  }, []);

  const applyPendingChanges = useCallback((
    units: UnitEntryForm[],
    onApply: (updatedUnits: UnitEntryForm[]) => void
  ) => {
    if (pendingChanges.length === 0) return;

    const updatedUnits = [...units];
    pendingChanges.forEach(change => {
      if (change.unitIndex < updatedUnits.length) {
        updatedUnits[change.unitIndex] = { ...change.proposedUnit };
      }
    });

    onApply(updatedUnits);
    clearPendingChanges();
  }, [pendingChanges, clearPendingChanges]);

  const getPendingChangeForUnit = useCallback((unitIndex: number) => {
    return pendingChanges.find(c => c.unitIndex === unitIndex);
  }, [pendingChanges]);

  const calculateTotalWithPending = useCallback((
    units: UnitEntryForm[],
    unitCost: number
  ) => {
    if (pendingChanges.length === 0) {
      // No pending changes, calculate total normally
      const totalFromPrices = units.reduce((sum, unit, index) => {
        return sum + (unit.price || unitCost);
      }, 0);
      return totalFromPrices > 0 ? totalFromPrices : units.length * unitCost;
    }

    // Calculate total with pending changes applied
    return units.reduce((sum, unit, index) => {
      const pendingChange = pendingChanges.find(c => c.unitIndex === index);
      const effectivePrice = pendingChange?.proposedUnit.price || unit.price || unitCost;
      return sum + effectivePrice;
    }, 0);
  }, [pendingChanges]);

  return {
    pendingChanges,
    hasPendingChanges,
    addPendingChanges,
    removePendingChange,
    clearPendingChanges,
    applyPendingChanges,
    getPendingChangeForUnit,
    calculateTotalWithPending,
  };
}