/**
 * Test Dashboard Component
 * Provides UI for running and viewing test results
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Play, FileText, Download, BarChart3 } from 'lucide-react';
import { 
  comprehensiveTestRunner, 
  runAllTests, 
  runCriticalTests, 
  getTestStatistics 
} from './comprehensive-test-suite';
import type { TestReport } from './enhanced-test-runner';

export function TestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentReport, setCurrentReport] = useState<TestReport | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<string>('all');

  const statistics = getTestStatistics();

  const runTests = async (type: 'all' | 'critical' | 'performance' | 'edge-case') => {
    setIsRunning(true);
    try {
      let report: TestReport;
      
      switch (type) {
        case 'critical':
          report = await runCriticalTests();
          break;
        case 'performance':
          report = await comprehensiveTestRunner.runPerformanceTests();
          break;
        case 'edge-case':
          report = await comprehensiveTestRunner.runEdgeCaseTests();
          break;
        default:
          report = await runAllTests();
      }
      
      setCurrentReport(report);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = (format: 'json' | 'html') => {
    if (!currentReport) return;
    
    if (format === 'json') {
      const jsonReport = comprehensiveTestRunner.exportReport(currentReport);
      const blob = new Blob([jsonReport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const htmlReport = comprehensiveTestRunner.generateHTMLReport(currentReport);
      const blob = new Blob([htmlReport], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-report-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
    }
  };

  const getSuccessRate = (report: TestReport) => {
    if (report.summary.totalTests === 0) return 0;
    return (report.summary.passed / report.summary.totalTests) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{statistics.totalSuites}</div>
              <div className="text-sm text-muted-foreground">Test Suites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{statistics.totalTests}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(statistics.tagDistribution).length}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.tagDistribution.critical || 0}
              </div>
              <div className="text-sm text-muted-foreground">Critical Tests</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              onClick={() => runTests('all')} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run All Tests
            </Button>
            <Button 
              onClick={() => runTests('critical')} 
              disabled={isRunning}
              variant="outline"
            >
              Run Critical Tests
            </Button>
            <Button 
              onClick={() => runTests('performance')} 
              disabled={isRunning}
              variant="outline"
            >
              Performance Tests
            </Button>
            <Button 
              onClick={() => runTests('edge-case')} 
              disabled={isRunning}
              variant="outline"
            >
              Edge Case Tests
            </Button>
          </div>

          {isRunning && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Running tests...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {currentReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportReport('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportReport('html')}>
                  <FileText className="h-4 w-4 mr-2" />
                  HTML
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-xl font-bold">{currentReport.summary.totalTests}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{currentReport.summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{currentReport.summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{getSuccessRate(currentReport).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{(currentReport.summary.duration / 1000).toFixed(1)}s</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>

            <Tabs defaultValue="suites">
              <TabsList>
                <TabsTrigger value="suites">Test Suites</TabsTrigger>
                <TabsTrigger value="failed">Failed Tests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="suites" className="space-y-4">
                {currentReport.suites.map((suite) => (
                  <Card key={suite.suite}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{suite.suite}</CardTitle>
                        <Badge variant={suite.failed === 0 ? "default" : "destructive"}>
                          {suite.passed}/{suite.totalTests}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {suite.results.map((test) => (
                          <div key={test.id} className="flex items-center justify-between p-2 rounded border">
                            <span className="font-medium">{test.name}</span>
                            <Badge variant={test.success ? "default" : "destructive"}>
                              {test.success ? "PASS" : "FAIL"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="failed">
                {currentReport.suites.map((suite) => {
                  const failedTests = suite.results.filter(r => !r.success);
                  if (failedTests.length === 0) return null;
                  
                  return (
                    <Card key={suite.suite}>
                      <CardHeader>
                        <CardTitle className="text-lg text-red-600">{suite.suite}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {failedTests.map((test) => (
                            <div key={test.id} className="border-l-4 border-red-500 pl-4">
                              <div className="font-medium">{test.name}</div>
                              <div className="text-sm text-red-600 font-mono mt-1">
                                Error: {test.error}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}