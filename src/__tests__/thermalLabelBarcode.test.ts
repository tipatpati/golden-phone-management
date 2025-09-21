import { describe, it, expect } from 'vitest';

// This test file has been deprecated as useThermalLabels has been replaced
// with the unified label system using useLabelDataProvider.
// 
// The new system provides better error handling, retry logic, and supports
// both inventory and supplier label generation through a unified interface.
//
// Future tests should focus on testing useLabelDataProvider instead.

describe.skip('Thermal Label Barcode Uniqueness - DEPRECATED', () => {
  it('should migrate to use useLabelDataProvider', () => {
    expect(true).toBe(true);
  });
});