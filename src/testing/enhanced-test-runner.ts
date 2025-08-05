/**
 * Enhanced Test Runner for Comprehensive Testing
 */

export interface TestSuite {
  name: string;
  description: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  test: () => Promise<void> | void;
  timeout?: number;
  retries?: number;
  tags?: string[];
}

export interface TestResult {
  id: string;
  name: string;
  success: boolean;
  error?: string;
  duration: number;
  timestamp: Date;
  tags?: string[];
}

export interface TestSuiteResult {
  suite: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: Date;
  results: TestResult[];
}

export interface TestReport {
  summary: {
    totalSuites: number;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coverage?: number;
  };
  suites: TestSuiteResult[];
  timestamp: Date;
}

export class EnhancedTestRunner {
  private suites: Map<string, TestSuite> = new Map();
  private globalSetup?: () => Promise<void>;
  private globalTeardown?: () => Promise<void>;

  /**
   * Register a test suite
   */
  registerSuite(suite: TestSuite) {
    this.suites.set(suite.name, suite);
  }

  /**
   * Set global setup function
   */
  setGlobalSetup(fn: () => Promise<void>) {
    this.globalSetup = fn;
  }

  /**
   * Set global teardown function
   */
  setGlobalTeardown(fn: () => Promise<void>) {
    this.globalTeardown = fn;
  }

  /**
   * Run a specific test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = performance.now();
    const maxRetries = testCase.retries ?? 0;
    const timeout = testCase.timeout ?? 30000; // 30 seconds default
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
        });
        
        // Run the test with timeout
        await Promise.race([
          Promise.resolve(testCase.test()),
          timeoutPromise
        ]);
        
        const duration = performance.now() - startTime;
        return {
          id: testCase.id,
          name: testCase.name,
          success: true,
          duration,
          timestamp: new Date(),
          tags: testCase.tags
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    const duration = performance.now() - startTime;
    return {
      id: testCase.id,
      name: testCase.name,
      success: false,
      error: lastError?.message || 'Unknown error',
      duration,
      timestamp: new Date(),
      tags: testCase.tags
    };
  }

  /**
   * Run a specific test suite
   */
  async runSuite(suiteName: string): Promise<TestSuiteResult> {
    const suite = this.suites.get(suiteName);
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found`);
    }

    const startTime = performance.now();
    const results: TestResult[] = [];

    try {
      // Run suite setup
      if (suite.setup) {
        await suite.setup();
      }

      // Run all tests in the suite
      for (const testCase of suite.tests) {
        const result = await this.runTest(testCase);
        results.push(result);
      }
    } finally {
      // Run suite teardown
      if (suite.teardown) {
        try {
          await suite.teardown();
        } catch (error) {
          console.warn(`Teardown failed for suite ${suiteName}:`, error);
        }
      }
    }

    const duration = performance.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      suite: suiteName,
      totalTests: suite.tests.length,
      passed,
      failed,
      skipped: 0,
      duration,
      timestamp: new Date(),
      results
    };
  }

  /**
   * Run all test suites
   */
  async runAll(): Promise<TestReport> {
    const startTime = performance.now();
    const suiteResults: TestSuiteResult[] = [];

    try {
      // Run global setup
      if (this.globalSetup) {
        await this.globalSetup();
      }

      // Run all suites
      for (const suiteName of this.suites.keys()) {
        try {
          const result = await this.runSuite(suiteName);
          suiteResults.push(result);
        } catch (error) {
          console.error(`Failed to run suite ${suiteName}:`, error);
          // Create a failed suite result
          suiteResults.push({
            suite: suiteName,
            totalTests: 0,
            passed: 0,
            failed: 1,
            skipped: 0,
            duration: 0,
            timestamp: new Date(),
            results: [{
              id: 'suite-error',
              name: 'Suite Setup/Teardown',
              success: false,
              error: error instanceof Error ? error.message : String(error),
              duration: 0,
              timestamp: new Date()
            }]
          });
        }
      }
    } finally {
      // Run global teardown
      if (this.globalTeardown) {
        try {
          await this.globalTeardown();
        } catch (error) {
          console.warn('Global teardown failed:', error);
        }
      }
    }

    const duration = performance.now() - startTime;
    const totalTests = suiteResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passed = suiteResults.reduce((sum, suite) => sum + suite.passed, 0);
    const failed = suiteResults.reduce((sum, suite) => sum + suite.failed, 0);
    const skipped = suiteResults.reduce((sum, suite) => sum + suite.skipped, 0);

    return {
      summary: {
        totalSuites: this.suites.size,
        totalTests,
        passed,
        failed,
        skipped,
        duration
      },
      suites: suiteResults,
      timestamp: new Date()
    };
  }

  /**
   * Run tests by tags
   */
  async runByTags(tags: string[]): Promise<TestReport> {
    const startTime = performance.now();
    const suiteResults: TestSuiteResult[] = [];

    for (const [suiteName, suite] of this.suites) {
      const filteredTests = suite.tests.filter(test => 
        test.tags?.some(tag => tags.includes(tag))
      );

      if (filteredTests.length === 0) continue;

      const filteredSuite = { ...suite, tests: filteredTests };
      this.suites.set(`${suiteName}_filtered`, filteredSuite);
      
      try {
        const result = await this.runSuite(`${suiteName}_filtered`);
        suiteResults.push({ ...result, suite: suiteName });
      } finally {
        this.suites.delete(`${suiteName}_filtered`);
      }
    }

    const duration = performance.now() - startTime;
    const totalTests = suiteResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passed = suiteResults.reduce((sum, suite) => sum + suite.passed, 0);
    const failed = suiteResults.reduce((sum, suite) => sum + suite.failed, 0);

    return {
      summary: {
        totalSuites: suiteResults.length,
        totalTests,
        passed,
        failed,
        skipped: 0,
        duration
      },
      suites: suiteResults,
      timestamp: new Date()
    };
  }

  /**
   * Get test statistics
   */
  getStats() {
    const totalSuites = this.suites.size;
    const totalTests = Array.from(this.suites.values())
      .reduce((sum, suite) => sum + suite.tests.length, 0);

    return {
      totalSuites,
      totalTests,
      suiteNames: Array.from(this.suites.keys())
    };
  }
}

/**
 * Enhanced assertion functions with better error messages
 */
export const expect = {
  /**
   * Assert that a condition is true
   */
  toBeTruthy(value: any, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected ${value} to be truthy`);
    }
  },

  /**
   * Assert that a condition is false
   */
  toBeFalsy(value: any, message?: string): void {
    if (value) {
      throw new Error(message || `Expected ${value} to be falsy`);
    }
  },

  /**
   * Assert that two values are equal
   */
  toEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
      );
    }
  },

  /**
   * Assert that two objects are deeply equal
   */
  toDeepEqual(actual: any, expected: any, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        message || `Objects are not deeply equal:\nActual: ${JSON.stringify(actual, null, 2)}\nExpected: ${JSON.stringify(expected, null, 2)}`
      );
    }
  },

  /**
   * Assert that a value exists (not null or undefined)
   */
  toExist(value: any, message?: string): void {
    if (value == null) {
      throw new Error(message || `Expected value to exist, but got ${value}`);
    }
  },

  /**
   * Assert that a value is null or undefined
   */
  toBeNull(value: any, message?: string): void {
    if (value != null) {
      throw new Error(message || `Expected value to be null, but got ${value}`);
    }
  },

  /**
   * Assert that a number is greater than another
   */
  toBeGreaterThan(actual: number, expected: number, message?: string): void {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  },

  /**
   * Assert that a number is less than another
   */
  toBeLessThan(actual: number, expected: number, message?: string): void {
    if (actual >= expected) {
      throw new Error(message || `Expected ${actual} to be less than ${expected}`);
    }
  },

  /**
   * Assert that a string contains a substring
   */
  toContain(actual: string, expected: string, message?: string): void {
    if (!actual.includes(expected)) {
      throw new Error(message || `Expected "${actual}" to contain "${expected}"`);
    }
  },

  /**
   * Assert that an array contains an element
   */
  toContainElement<T>(actual: T[], expected: T, message?: string): void {
    if (!actual.includes(expected)) {
      throw new Error(message || `Expected array to contain ${JSON.stringify(expected)}`);
    }
  },

  /**
   * Assert that a function throws an error
   */
  toThrow(fn: () => void, expectedMessage?: string | RegExp): void {
    let threw = false;
    let actualError: Error | null = null;
    
    try {
      fn();
    } catch (error) {
      threw = true;
      actualError = error instanceof Error ? error : new Error(String(error));
    }
    
    if (!threw) {
      throw new Error('Expected function to throw an error');
    }
    
    if (expectedMessage && actualError) {
      if (typeof expectedMessage === 'string' && !actualError.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", but got "${actualError.message}"`);
      }
      if (expectedMessage instanceof RegExp && !expectedMessage.test(actualError.message)) {
        throw new Error(`Expected error message to match ${expectedMessage}, but got "${actualError.message}"`);
      }
    }
  },

  /**
   * Assert that an async function throws an error
   */
  async toThrowAsync(fn: () => Promise<void>, expectedMessage?: string | RegExp): Promise<void> {
    let threw = false;
    let actualError: Error | null = null;
    
    try {
      await fn();
    } catch (error) {
      threw = true;
      actualError = error instanceof Error ? error : new Error(String(error));
    }
    
    if (!threw) {
      throw new Error('Expected async function to throw an error');
    }
    
    if (expectedMessage && actualError) {
      if (typeof expectedMessage === 'string' && !actualError.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", but got "${actualError.message}"`);
      }
      if (expectedMessage instanceof RegExp && !expectedMessage.test(actualError.message)) {
        throw new Error(`Expected error message to match ${expectedMessage}, but got "${actualError.message}"`);
      }
    }
  }
};

/**
 * Create a new enhanced test runner instance
 */
export function createEnhancedTestRunner(): EnhancedTestRunner {
  return new EnhancedTestRunner();
}