import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, FileText, Settings, CheckCircle } from 'lucide-react';

interface PropDefinition {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  defaultValue?: string;
}

interface ExampleUsage {
  title: string;
  description: string;
  code: string;
}

interface ComponentDocsProps {
  componentName: string;
  description: string;
  props: PropDefinition[];
  examples: ExampleUsage[];
  dependencies?: string[];
  version?: string;
}

export function ComponentDocs({ 
  componentName, 
  description, 
  props, 
  examples, 
  dependencies = [],
  version = '1.0.0'
}: ComponentDocsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {componentName}
            </CardTitle>
            <Badge variant="outline">v{version}</Badge>
          </div>
          <p className="text-muted-foreground mt-2">{description}</p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="props" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="props" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Props
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Examples
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        {/* Props Documentation */}
        <TabsContent value="props">
          <Card>
            <CardHeader>
              <CardTitle>Component Props</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {props.map((prop) => (
                  <div key={prop.name} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {prop.name}
                      </code>
                      <Badge variant={prop.required ? "default" : "secondary"}>
                        {prop.required ? "Required" : "Optional"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {prop.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {prop.description}
                    </p>
                    {prop.defaultValue && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Default: </span>
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                          {prop.defaultValue}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples">
          <div className="space-y-4">
            {examples.map((example, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {example.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{example.code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Dependencies */}
        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              {dependencies.length > 0 ? (
                <div className="grid gap-2">
                  {dependencies.map((dep) => (
                    <div key={dep} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code className="text-sm">{dep}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No external dependencies</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changelog */}
        <TabsContent value="changelog">
          <Card>
            <CardHeader>
              <CardTitle>Changelog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge>v{version}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>• Initial component implementation</li>
                    <li>• Added comprehensive prop validation</li>
                    <li>• Integrated with design system</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}