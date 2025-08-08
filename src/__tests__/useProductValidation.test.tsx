import React from 'react';
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useProductValidation } from '@/components/inventory/forms/hooks/useProductValidation';

describe('useProductValidation', () => {
  it('flags errors for empty product data and allows clearing', () => {
    const { result } = renderHook(() => useProductValidation());

    act(() => {
      const errs = result.current.validateForm({});
      expect(errs.length).toBeGreaterThan(0);
    });

    expect(result.current.hasErrors).toBe(true);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.hasErrors).toBe(false);
  });
});
