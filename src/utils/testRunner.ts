/**
 * Simple test runner for component testing
 */
export interface TestResult {
  success: boolean;
  error?: string;
  duration: number;
}

export class TestRunner {
  private tests: Map<string, () => Promise<void> | void> = new Map();

  /**
   * Register a test case
   */
  register(name: string, testFn: () => Promise<void> | void) {
    this.tests.set(name, testFn);
  }

  /**
   * Run a specific test by name
   */
  async runTest(name: string): Promise<TestResult> {
    const testFn = this.tests.get(name);
    if (!testFn) {
      return {
        success: false,
        error: `Test '${name}' not found`,
        duration: 0
      };
    }

    const startTime = performance.now();
    
    try {
      await testFn();
      const duration = performance.now() - startTime;
      return {
        success: true,
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  /**
   * Run all registered tests
   */
  async runAll(): Promise<Map<string, TestResult>> {
    const results = new Map<string, TestResult>();
    
    for (const [name] of this.tests) {
      const result = await this.runTest(name);
      results.set(name, result);
    }
    
    return results;
  }

  /**
   * Get list of all registered test names
   */
  getTestNames(): string[] {
    return Array.from(this.tests.keys());
  }
}

/**
 * Simple assertion functions for testing
 */
export const assert = {
  /**
   * Assert that a condition is true
   */
  isTrue(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  },

  /**
   * Assert that two values are equal
   */
  equals<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${expected}, but got ${actual}`
      );
    }
  },

  /**
   * Assert that a value is not null or undefined
   */
  exists(value: any, message?: string): void {
    if (value == null) {
      throw new Error(message || 'Expected value to exist');
    }
  },

  /**
   * Assert that a function throws an error
   */
  throws(fn: () => void, message?: string): void {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    
    if (!threw) {
      throw new Error(message || 'Expected function to throw an error');
    }
  },

  /**
   * Assert that an async function throws an error
   */
  async throwsAsync(fn: () => Promise<void>, message?: string): Promise<void> {
    let threw = false;
    try {
      await fn();
    } catch {
      threw = true;
    }
    
    if (!threw) {
      throw new Error(message || 'Expected async function to throw an error');
    }
  }
};

/**
 * Create a new test runner instance
 */
export function createTestRunner(): TestRunner {
  return new TestRunner();
}