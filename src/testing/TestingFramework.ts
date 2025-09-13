/**
 * Testing Framework Core
 * Essential testing utilities without complex syntax
 */

import { logger } from '@/utils/secureLogger';

/**
 * Simple testing utilities
 */
export class TestingCore {
  private static mocks = new Map<string, any>();

  /**
   * Create a mock function
   */
  static createMock<T extends (...args: any[]) => any>(implementation?: T): T {
    const mockFn = (...args: any[]) => {
      if (implementation) {
        return implementation(...args);
      }
      return undefined;
    };
    
    (mockFn as any).calls = [];
    (mockFn as any).mockClear = () => {
      (mockFn as any).calls = [];
    };
    
    return mockFn as T;
  }

  /**
   * Mock a service
   */
  static mockService(serviceName: string, implementation: any) {
    const mock = this.createMock(implementation);
    this.mocks.set(serviceName, mock);
    return mock;
  }

  /**
   * Get a mock
   */
  static getMock(serviceName: string) {
    return this.mocks.get(serviceName);
  }

  /**
   * Clear all mocks
   */
  static clearMocks() {
    this.mocks.clear();
  }

  /**
   * Assert equality
   */
  static assertEqual<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
      const errorMessage = message || `Expected ${expected}, but got ${actual}`;
      logger.error('Assertion failed', { actual, expected, message: errorMessage }, 'TestingCore');
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert truthiness
   */
  static assertTrue(condition: boolean, message?: string) {
    if (!condition) {
      const errorMessage = message || 'Expected condition to be true';
      logger.error('Assertion failed', { message: errorMessage }, 'TestingCore');
      throw new Error(errorMessage);
    }
  }

  /**
   * Test async operation
   */
  static async testAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: Error }> {
    try {
      logger.debug(`Starting async test: ${name}`, {}, 'TestingCore');
      const result = await operation();
      logger.debug(`Async test passed: ${name}`, {}, 'TestingCore');
      return { success: true, result };
    } catch (error) {
      logger.error(`Async test failed: ${name}`, { error }, 'TestingCore');
      return { success: false, error: error as Error };
    }
  }

  /**
   * Performance measurement
   */
  static async measurePerformance<T>(
    name: string,
    operation: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    
    logger.debug(`Performance test: ${name}`, { duration: `${duration.toFixed(2)}ms` }, 'TestingCore');
    
    return { result, duration };
  }
}

/**
 * Test data factory
 */
export class TestDataFactory {
  static createUser(overrides: Record<string, any> = {}) {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createProduct(overrides: Record<string, any> = {}) {
    return {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      category: 'Electronics',
      status: 'active',
      stock: 10,
      ...overrides
    };
  }

  static createClient(overrides: Record<string, any> = {}) {
    return {
      id: '1',
      type: 'individual',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      status: 'active',
      ...overrides
    };
  }

  static createArray<T>(factory: (index: number) => T, count: number): T[] {
    return Array.from({ length: count }, (_, index) => factory(index));
  }
}

/**
 * API testing utilities
 */
export class ApiTestUtils {
  private static originalFetch: typeof fetch;

  static mockApi() {
    this.originalFetch = globalThis.fetch;
    const responses = new Map<string, any>();

    globalThis.fetch = async (input: any, init?: any): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.url;
      const response = responses.get(url);
      
      if (response) {
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    return {
      mockResponse: (url: string, data: any) => {
        responses.set(url, data);
      },
      clearMocks: () => {
        responses.clear();
      }
    };
  }

  static restoreApi() {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
    }
  }
}

/**
 * Simple test runner
 */
export class SimpleTestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private beforeEachFn?: () => void;
  private afterEachFn?: () => void;

  describe(suiteName: string, callback: () => void) {
    logger.info(`Test Suite: ${suiteName}`, {}, 'SimpleTestRunner');
    callback();
  }

  it(testName: string, testFn: () => Promise<void> | void) {
    this.tests.push({ name: testName, fn: testFn });
  }

  beforeEach(fn: () => void) {
    this.beforeEachFn = fn;
  }

  afterEach(fn: () => void) {
    this.afterEachFn = fn;
  }

  async run() {
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        if (this.beforeEachFn) {
          this.beforeEachFn();
        }

        await test.fn();

        if (this.afterEachFn) {
          this.afterEachFn();
        }

        logger.info(`✓ ${test.name}`, {}, 'SimpleTestRunner');
        passed++;
      } catch (error) {
        logger.error(`✗ ${test.name}`, { error }, 'SimpleTestRunner');
        failed++;
      }
    }

    logger.info(`Test Results: ${passed} passed, ${failed} failed`, {}, 'SimpleTestRunner');
    return { passed, failed, total: this.tests.length };
  }
}

// Export instances
export const testRunner = new SimpleTestRunner();
export { TestingCore as TestFramework };

// Export testing utilities
export const testUtils = {
  createMock: TestingCore.createMock,
  mockService: TestingCore.mockService,
  assertEqual: TestingCore.assertEqual,
  assertTrue: TestingCore.assertTrue,
  testAsync: TestingCore.testAsync,
  measurePerformance: TestingCore.measurePerformance
};