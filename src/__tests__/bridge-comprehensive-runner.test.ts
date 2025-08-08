import { describe, it, expect } from 'vitest';
import { getTestStatistics } from '@/testing/comprehensive-test-suite';

// Lightweight bridge to ensure our custom runner is wired up.
describe('comprehensive-test-runner bridge', () => {
  it('exposes registered suites through statistics', () => {
    const stats = getTestStatistics();
    expect(stats).toBeDefined();
    // Expect at least one suite registered
    expect(stats.totalSuites).toBeGreaterThan(0);
    expect((stats as any).suiteRegistry?.length ?? 0).toBeGreaterThan(0);
  });
});
