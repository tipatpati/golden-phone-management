/**
 * Comprehensive Test Suite Runner
 * Orchestrates all test suites and provides reporting
 */

import { createEnhancedTestRunner, type TestReport, type EnhancedTestRunner } from './enhanced-test-runner';
import { mockDataFactory } from './mock-data-factory';

// Import all test suites
import { salesE2ETestSuite } from './suites/sales-e2e-tests';
import { clientManagementTestSuite } from './suites/client-management-tests';
import { inventoryManagementTestSuite } from './suites/inventory-management-tests';

export interface TestSuiteRegistry {
  name: string;
  description: string;
  tags: string[];
  suite: any;
}

export class ComprehensiveTestRunner {
  private testRunner: EnhancedTestRunner;
  private suiteRegistry: TestSuiteRegistry[] = [];

  constructor() {
    this.testRunner = createEnhancedTestRunner();
    this.registerAllSuites();
    this.setupGlobalHooks();
  }

  /**
   * Register all test suites
   */
  private registerAllSuites() {
    const suites: TestSuiteRegistry[] = [
      {
        name: 'Sales E2E Tests',
        description: 'End-to-end testing of sales workflows',
        tags: ['e2e', 'sales', 'critical'],
        suite: salesE2ETestSuite
      },
      {
        name: 'Client Management Tests',
        description: 'CRUD operations and validation for clients',
        tags: ['client', 'crud', 'validation'],
        suite: clientManagementTestSuite
      },
      {
        name: 'Inventory Management Tests',
        description: 'Product management and stock tracking',
        tags: ['inventory', 'product', 'stock'],
        suite: inventoryManagementTestSuite
      }
    ];

    // Register suites with the test runner
    suites.forEach(suiteRegistry => {
      this.suiteRegistry.push(suiteRegistry);
      this.testRunner.registerSuite(suiteRegistry.suite);
    });
  }

  /**
   * Setup global test hooks
   */
  private setupGlobalHooks() {
    this.testRunner.setGlobalSetup(async () => {
      console.log('🚀 Starting comprehensive test suite...');
      console.log(`📊 Total test suites: ${this.suiteRegistry.length}`);
      
      // Reset mock data factory
      mockDataFactory.reset();
      
      // Setup global test environment
      if (typeof global !== 'undefined') {
        global.TEST_MODE = true;
      }
    });

    this.testRunner.setGlobalTeardown(async () => {
      console.log('✅ Comprehensive test suite completed');
      
      // Cleanup global test environment
      if (typeof global !== 'undefined') {
        delete global.TEST_MODE;
      }
    });
  }

  /**
   * Run all test suites
   */
  async runAll(): Promise<TestReport> {
    console.log('📋 Running all test suites...');
    const report = await this.testRunner.runAll();
    this.printReport(report);
    return report;
  }

  /**
   * Run tests by specific tags
   */
  async runByTags(tags: string[]): Promise<TestReport> {
    console.log(`🏷️  Running tests with tags: ${tags.join(', ')}`);
    const report = await this.testRunner.runByTags(tags);
    this.printReport(report);
    return report;
  }

  /**
   * Run critical tests only
   */
  async runCriticalTests(): Promise<TestReport> {
    return this.runByTags(['critical']);
  }

  /**
   * Run specific test suite
   */
  async runSuite(suiteName: string): Promise<TestReport> {
    console.log(`📁 Running test suite: ${suiteName}`);
    const suiteResult = await this.testRunner.runSuite(suiteName);
    
    const report: TestReport = {
      summary: {
        totalSuites: 1,
        totalTests: suiteResult.totalTests,
        passed: suiteResult.passed,
        failed: suiteResult.failed,
        skipped: suiteResult.skipped,
        duration: suiteResult.duration
      },
      suites: [suiteResult],
      timestamp: new Date()
    };
    
    this.printReport(report);
    return report;
  }

  /**
   * Run performance tests with large datasets
   */
  async runPerformanceTests(): Promise<TestReport> {
    console.log('⚡ Running performance tests...');
    
    // Generate performance test data
    const performanceData = mockDataFactory.createPerformanceTestData();
    console.log(`📊 Generated test data:
      - Products: ${performanceData.products.length}
      - Clients: ${performanceData.clients.length}
      - Employees: ${performanceData.employees.length}
      - Sales: ${performanceData.sales.length}
      - Repairs: ${performanceData.repairs.length}
      - Suppliers: ${performanceData.suppliers.length}`);

    return this.runByTags(['performance']);
  }

  /**
   * Run edge case tests
   */
  async runEdgeCaseTests(): Promise<TestReport> {
    console.log('🎯 Running edge case tests...');
    
    // Generate edge case data
    const edgeCaseData = mockDataFactory.createEdgeCaseData();
    console.log('📊 Generated edge case test data');

    return this.runByTags(['edge-case']);
  }

  /**
   * Get test suite statistics
   */
  getStatistics() {
    const stats = this.testRunner.getStats();
    const tagCounts = new Map<string, number>();
    
    // Count tests by tags
    this.suiteRegistry.forEach(suiteRegistry => {
      suiteRegistry.suite.tests?.forEach((test: any) => {
        test.tags?.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
    });

    return {
      ...stats,
      suiteRegistry: this.suiteRegistry.map(sr => ({
        name: sr.name,
        description: sr.description,
        tags: sr.tags,
        testCount: sr.suite.tests?.length || 0
      })),
      tagDistribution: Object.fromEntries(tagCounts)
    };
  }

  /**
   * Print detailed test report
   */
  private printReport(report: TestReport) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST REPORT SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Total Duration: ${(report.summary.duration / 1000).toFixed(2)}s`);
    console.log(`📁 Test Suites: ${report.summary.totalSuites}`);
    console.log(`🧪 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⏭️  Skipped: ${report.summary.skipped}`);
    
    const successRate = report.summary.totalTests > 0 
      ? ((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)
      : '0';
    console.log(`📈 Success Rate: ${successRate}%`);

    // Suite-by-suite breakdown
    console.log('\n📁 SUITE BREAKDOWN');
    console.log('-'.repeat(60));
    
    report.suites.forEach(suite => {
      const suiteSuccessRate = suite.totalTests > 0 
        ? ((suite.passed / suite.totalTests) * 100).toFixed(1)
        : '0';
      
      console.log(`📂 ${suite.suite}`);
      console.log(`   Tests: ${suite.totalTests} | Passed: ${suite.passed} | Failed: ${suite.failed} | Rate: ${suiteSuccessRate}%`);
      console.log(`   Duration: ${(suite.duration / 1000).toFixed(2)}s`);
      
      // Show failed tests
      const failedTests = suite.results.filter(r => !r.success);
      if (failedTests.length > 0) {
        console.log('   ❌ Failed Tests:');
        failedTests.forEach(test => {
          console.log(`      - ${test.name}: ${test.error}`);
        });
      }
      console.log('');
    });

    // Overall result
    console.log('='.repeat(60));
    if (report.summary.failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log(`⚠️  ${report.summary.failed} TESTS FAILED`);
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Export report to JSON
   */
  exportReport(report: TestReport, filename?: string): string {
    const reportData = {
      ...report,
      generatedAt: new Date().toISOString(),
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        timestamp: Date.now()
      }
    };

    const jsonReport = JSON.stringify(reportData, null, 2);
    
    if (filename) {
      // In a real environment, you would save to file
      console.log(`📄 Report exported to: ${filename}`);
    }

    return jsonReport;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report: TestReport): string {
    const successRate = report.summary.totalTests > 0 
      ? ((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)
      : '0';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${report.timestamp.toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .stat-card { background: #f8f9fa; border-radius: 6px; padding: 20px; text-align: center; border-left: 4px solid #667eea; }
        .stat-value { font-size: 2em; font-weight: bold; color: #333; }
        .stat-label { color: #666; font-size: 0.9em; margin-top: 5px; }
        .success { border-left-color: #28a745; }
        .error { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        .suites { padding: 0 30px 30px; }
        .suite { margin-bottom: 30px; border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 15px 20px; border-bottom: 1px solid #e9ecef; }
        .suite-title { font-weight: bold; margin: 0; }
        .suite-stats { font-size: 0.9em; color: #666; margin-top: 5px; }
        .test-list { padding: 0; margin: 0; list-style: none; }
        .test-item { padding: 12px 20px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .test-name { flex: 1; }
        .test-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-pass { background: #d4edda; color: #155724; }
        .status-fail { background: #f8d7da; color: #721c24; }
        .test-error { font-size: 0.8em; color: #dc3545; margin-top: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Report</h1>
            <p>Generated on ${report.timestamp.toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value">${report.summary.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card success">
                <div class="stat-value">${report.summary.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card error">
                <div class="stat-value">${report.summary.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(report.summary.duration / 1000).toFixed(1)}s</div>
                <div class="stat-label">Duration</div>
            </div>
        </div>
        
        <div class="suites">
            ${report.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <h3 class="suite-title">${suite.suite}</h3>
                        <div class="suite-stats">
                            ${suite.totalTests} tests • ${suite.passed} passed • ${suite.failed} failed • ${(suite.duration / 1000).toFixed(2)}s
                        </div>
                    </div>
                    <ul class="test-list">
                        ${suite.results.map(test => `
                            <li class="test-item">
                                <div class="test-name">
                                    <strong>${test.name}</strong>
                                    ${test.error ? `<div class="test-error">Error: ${test.error}</div>` : ''}
                                </div>
                                <span class="test-status status-${test.success ? 'pass' : 'fail'}">
                                    ${test.success ? 'PASS' : 'FAIL'}
                                </span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    return html;
  }
}

// Export singleton instance
export const comprehensiveTestRunner = new ComprehensiveTestRunner();

// Export convenience functions
export const runAllTests = () => comprehensiveTestRunner.runAll();
export const runCriticalTests = () => comprehensiveTestRunner.runCriticalTests();
export const runPerformanceTests = () => comprehensiveTestRunner.runPerformanceTests();
export const runEdgeCaseTests = () => comprehensiveTestRunner.runEdgeCaseTests();
export const getTestStatistics = () => comprehensiveTestRunner.getStatistics();