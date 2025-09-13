/**
 * Example Test Implementation
 * Shows how to use the testing framework
 */

import { 
  TestingCore, 
  TestDataFactory, 
  ApiTestUtils, 
  testRunner,
  testUtils
} from '@/testing/TestingFramework';
import { logger } from '@/utils/secureLogger';

// Example service to test
class UserService {
  async getUser(id: string) {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }

  async createUser(userData: any) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
}

// Test suite
testRunner.describe('UserService Tests', () => {
  const userService = new UserService();
  const apiMocks = ApiTestUtils.mockApi();

  testRunner.beforeEach(() => {
    TestingCore.clearMocks();
  });

  testRunner.afterEach(() => {
    apiMocks.clearMocks();
  });

  testRunner.it('should fetch user data', async () => {
    // Setup
    const mockUser = TestDataFactory.createUser({ id: '123', name: 'John Doe' });
    apiMocks.mockResponse('/api/users/123', mockUser);

    // Execute
    const result = await userService.getUser('123');

    // Assert
    testUtils.assertEqual(result.id, '123');
    testUtils.assertEqual(result.name, 'John Doe');
  });

  testRunner.it('should create new user', async () => {
    // Setup
    const userData = { name: 'Jane Doe', email: 'jane@example.com' };
    const createdUser = TestDataFactory.createUser(userData);
    apiMocks.mockResponse('/api/users', createdUser);

    // Execute
    const result = await userService.createUser(userData);

    // Assert
    testUtils.assertEqual(result.name, 'Jane Doe');
    testUtils.assertEqual(result.email, 'jane@example.com');
  });

  testRunner.it('should handle async operations', async () => {
    const testResult = await testUtils.testAsync('async operation', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'success';
    });

    testUtils.assertTrue(testResult.success);
    testUtils.assertEqual(testResult.result, 'success');
  });

  testRunner.it('should measure performance', async () => {
    const perfResult = await testUtils.measurePerformance('performance test', () => {
      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    });

    testUtils.assertTrue(perfResult.duration < 100); // Should be fast
    testUtils.assertEqual(perfResult.result, 499500); // Mathematical result
  });
});

// Data factory tests
testRunner.describe('Test Data Factory', () => {
  testRunner.it('should create user data', () => {
    const user = TestDataFactory.createUser();
    
    testUtils.assertTrue(!!user.id);
    testUtils.assertTrue(!!user.email);
    testUtils.assertEqual(user.name, 'Test User');
  });

  testRunner.it('should create user with overrides', () => {
    const user = TestDataFactory.createUser({ name: 'Custom Name', age: 25 });
    
    testUtils.assertEqual(user.name, 'Custom Name');
    testUtils.assertEqual((user as any).age, 25);
  });

  testRunner.it('should create arrays of data', () => {
    const users = TestDataFactory.createArray(
      (index) => TestDataFactory.createUser({ id: `user-${index}` }),
      3
    );

    testUtils.assertEqual(users.length, 3);
    testUtils.assertEqual(users[0].id, 'user-0');
    testUtils.assertEqual(users[2].id, 'user-2');
  });
});

// Mock service tests
testRunner.describe('Mock Service Tests', () => {
  testRunner.it('should create and use mocks', () => {
    const mockFn = testUtils.createMock((x: number) => x * 2);
    
    const result = mockFn(5);
    testUtils.assertEqual(result, 10);
  });

  testRunner.it('should register and retrieve service mocks', () => {
    const mockService = testUtils.mockService('calculator', (a: number, b: number) => a + b);
    
    const result = mockService(3, 4);
    testUtils.assertEqual(result, 7);
    
    const retrievedMock = TestingCore.getMock('calculator');
    testUtils.assertTrue(!!retrievedMock);
  });
});

// Export test runner for execution
export const runAllTests = async () => {
  logger.info('Starting test execution...', {}, 'TestRunner');
  
  try {
    const results = await testRunner.run();
    
    logger.info('Test execution completed', {
      passed: results.passed,
      failed: results.failed,
      total: results.total,
      success: results.failed === 0
    }, 'TestRunner');
    
    return results;
  } catch (error) {
    logger.error('Test execution failed', { error }, 'TestRunner');
    throw error;
  } finally {
    // Cleanup
    ApiTestUtils.restoreApi();
    TestingCore.clearMocks();
  }
};

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Delay to allow app initialization
  setTimeout(() => {
    runAllTests().catch(error => {
      logger.error('Auto test run failed', { error }, 'TestRunner');
    });
  }, 5000);
}