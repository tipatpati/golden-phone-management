import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSerialNumberManager } from '@/components/inventory/forms/hooks/useSerialNumberManager';

describe('useSerialNumberManager', () => {
  it('manages serial numbers and updates stock count', () => {
    const onStockChange = vi.fn();

    const { result } = renderHook(() =>
      useSerialNumberManager({ initialSerialNumbers: [], productId: 'P1', onStockChange })
    );

    expect(result.current.serialCount).toBe(0);

    act(() => {
      result.current.updateSerialNumbers('ABC123\nXYZ456');
    });

    expect(result.current.serialCount).toBe(2);
    expect(onStockChange).toHaveBeenCalledWith(2);

    act(() => {
      result.current.addSerialNumber('LMN789');
    });

    expect(result.current.serialCount).toBe(3);

    act(() => {
      result.current.removeSerialNumber(1); // remove XYZ456
    });

    expect(result.current.serialCount).toBe(2);
  });
});
