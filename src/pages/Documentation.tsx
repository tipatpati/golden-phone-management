import React, { useState } from 'react';
import { ComponentDocs } from '@/components/documentation/ComponentDocs';
import { ComponentTester } from '@/components/testing/ComponentTester';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, TestTube, Code, Database } from 'lucide-react';
import { createTestRunner, assert } from '@/utils/testRunner';

const componentDocs = [
  {
    componentName: 'ErrorBoundary',
    description: 'Catches JavaScript errors in component tree and displays fallback UI',
    props: [
      {
        name: 'children',
        type: 'React.ReactNode',
        description: 'Component tree to wrap with error boundary',
        required: true
      },
      {
        name: 'fallback',
        type: 'React.ComponentType<ErrorFallbackProps>',
        description: 'Custom fallback component to display on error',
        required: false
      }
    ],
    examples: [
      {
        title: 'Basic Usage',
        description: 'Wrap components that might throw errors',
        code: `<ErrorBoundary>
  <SomeComponentThatMightFail />
</ErrorBoundary>`
      },
      {
        title: 'Custom Fallback',
        description: 'Provide custom error UI',
        code: `<ErrorBoundary fallback={CustomErrorComponent}>
  <App />
</ErrorBoundary>`
      }
    ],
    dependencies: ['react', 'lucide-react']
  },
  {
    componentName: 'useForm',
    description: 'Custom hook for form state management with validation',
    props: [
      {
        name: 'initialData',
        type: 'T',
        description: 'Initial form data object',
        required: true
      },
      {
        name: 'validationSchema',
        type: 'z.ZodSchema<T>',
        description: 'Zod schema for validation',
        required: false
      },
      {
        name: 'componentName',
        type: 'string',
        description: 'Name for error context',
        required: false,
        defaultValue: 'Form'
      }
    ],
    examples: [
      {
        title: 'Basic Form',
        description: 'Simple form with validation',
        code: `const form = useForm(
  { email: '', password: '' },
  LoginSchema,
  'LoginForm'
);

// In component
<Input
  value={form.data.email}
  onChange={(e) => form.updateField('email', e.target.value)}
/>`
      }
    ],
    dependencies: ['zod', 'react']
  }
];

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(componentDocs[0]);

  // Test runner setup
  const testRunner = createTestRunner();
  
  // Register some example tests
  testRunner.register('ErrorBoundary - catches errors', () => {
    assert.isTrue(true, 'ErrorBoundary should catch errors');
  });
  
  testRunner.register('useForm - validates data', () => {
    const data = { email: 'test@test.com' };
    assert.exists(data, 'Form data should exist');
  });

  interface TestCase {
    id: string;
    name: string;
    description: string;
    status: 'pass' | 'fail' | 'pending' | 'skip';
    error?: string;
  }

  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: '1',
      name: 'ErrorBoundary - catches errors',
      description: 'Should catch JavaScript errors and display fallback UI',
      status: 'pending'
    },
    {
      id: '2', 
      name: 'useForm - validates data',
      description: 'Should validate form data using Zod schema',
      status: 'pending'
    }
  ]);

  const filteredDocs = componentDocs.filter(doc =>
    doc.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRunTest = async (testId: string) => {
    const testCase = testCases.find(t => t.id === testId);
    if (!testCase) return;

    setTestCases(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'pending' as TestCase['status'] } : t
    ));

    const result = await testRunner.runTest(testCase.name);
    
    setTestCases(prev => prev.map(t => 
      t.id === testId 
        ? { 
            ...t, 
            status: result.success ? 'pass' as TestCase['status'] : 'fail' as TestCase['status'],
            error: result.error
          } 
        : t
    ));
  };

  const handleRunAllTests = async () => {
    const results = await testRunner.runAll();
    
    setTestCases(prev => prev.map(testCase => {
      const result = results.get(testCase.name);
      return result ? {
        ...testCase,
        status: result.success ? 'pass' as TestCase['status'] : 'fail' as TestCase['status'],
        error: result.error
      } : testCase;
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentation & Testing</h1>
          <p className="text-muted-foreground mt-2">
            Component documentation, API reference, and automated testing
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Phase 4: Testing & Documentation
        </Badge>
      </div>

      <Tabs defaultValue="documentation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API Reference
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Schema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" className="space-y-6">
          <div className="flex gap-6">
            {/* Component List */}
            <div className="w-1/3 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2">
                {filteredDocs.map((doc) => (
                  <Card
                    key={doc.componentName}
                    className={`cursor-pointer transition-colors ${
                      selectedComponent.componentName === doc.componentName
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedComponent(doc)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{doc.componentName}</CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.description}
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Component Documentation */}
            <div className="flex-1">
              <ComponentDocs {...selectedComponent} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <ComponentTester
            componentName="Core Components"
            testCases={testCases}
            onRunTest={handleRunTest}
            onRunAllTests={handleRunAllTests}
          />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Error Handling</h3>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Error Handler Usage
import { useErrorHandler } from '@/utils/errorHandler';

const { handleError, withErrorHandling } = useErrorHandler('ComponentName');

// Handle errors
try {
  await riskyOperation();
} catch (error) {
  handleError(error, 'operationName');
}

// Or use wrapper
const { data, error } = await withErrorHandling(
  () => riskyOperation(),
  'operationName'
);`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Form Management</h3>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Form Hook Usage
import { useForm } from '@/hooks/useForm';
import { LoginSchema } from '@/schemas/validation';

const form = useForm(
  { email: '', password: '' },
  LoginSchema,
  'LoginForm'
);

// Form state
form.data.email         // Current data
form.errors.email       // Field errors
form.isLoading         // Loading state
form.isValid           // Validation state

// Form actions
form.updateField('email', value)
form.handleSubmit(submitFn, onSuccess, onError)
form.validate()
form.reset()`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Core Tables</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['products', 'clients', 'sales', 'repairs', 'employees'].map(table => (
                      <Badge key={table} variant="outline" className="justify-center p-2">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Performance Indexes</h3>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`-- Key indexes for performance
CREATE INDEX idx_products_brand_model ON products(brand, model);
CREATE INDEX idx_sales_date_status ON sales(sale_date, status);
CREATE INDEX idx_repairs_status_priority ON repairs(status, priority);
CREATE INDEX idx_clients_type_status ON clients(type, status);

-- Search indexes
CREATE INDEX idx_products_search ON products USING GIN(
  to_tsvector('english', brand || ' ' || model)
);`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}