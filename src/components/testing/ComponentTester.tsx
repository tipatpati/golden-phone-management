import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'pending' | 'skip';
  error?: string;
}

interface ComponentTestProps {
  componentName: string;
  testCases: TestCase[];
  onRunTest: (testId: string) => void;
  onRunAllTests: () => void;
}

export function ComponentTester({ componentName, testCases, onRunTest, onRunAllTests }: ComponentTestProps) {
  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestCase['status']) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      pending: 'secondary',
      skip: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  const passedTests = testCases.filter(test => test.status === 'pass').length;
  const totalTests = testCases.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{componentName} Tests</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {passedTests}/{totalTests} passed
            </span>
            <Button size="sm" onClick={onRunAllTests}>
              <Play className="h-4 w-4 mr-2" />
              Run All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {testCases.map((testCase) => (
          <div
            key={testCase.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(testCase.status)}
              <div>
                <div className="font-medium">{testCase.name}</div>
                <div className="text-sm text-muted-foreground">{testCase.description}</div>
                {testCase.error && (
                  <div className="text-sm text-red-600 mt-1 font-mono">
                    Error: {testCase.error}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(testCase.status)}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRunTest(testCase.id)}
              >
                Run
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}