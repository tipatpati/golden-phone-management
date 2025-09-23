import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TracingSearchBar } from '@/components/tracing/TracingSearchBar';
import { TraceResultCard } from '@/components/tracing/TraceResultCard';
import { ProductTraceTimeline } from '@/components/tracing/ProductTraceTimeline';
import { useProductTrace } from '@/hooks/useProductTrace';
import { ProductTracingService } from '@/services/tracing/ProductTracingService';
import { SearchX, AlertCircle, Route } from 'lucide-react';

export default function ProductTracing() {
  const [searchedSerial, setSearchedSerial] = useState<string | null>(null);
  
  const { 
    data: traceResult, 
    isLoading, 
    error, 
    isError 
  } = useProductTrace(searchedSerial);

  const handleSearch = (serialNumber: string) => {
    setSearchedSerial(serialNumber);
  };

  const timelineEvents = traceResult 
    ? ProductTracingService.generateTimelineEvents(traceResult)
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Route className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Product Tracing</h1>
          <p className="text-muted-foreground">
            Track the complete lifecycle of products from acquisition to sale
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Product</CardTitle>
        </CardHeader>
        <CardContent>
          <TracingSearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="Enter serial number, IMEI, or barcode to trace product..."
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Tracing product lifecycle...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'Failed to trace product. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {searchedSerial && !isLoading && !traceResult && !isError && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <SearchX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
              <p className="text-muted-foreground">
                No product found with serial number: <code className="bg-muted px-2 py-1 rounded">{searchedSerial}</code>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check the serial number and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {traceResult && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Product Details */}
          <div className="space-y-6">
            <TraceResultCard traceResult={traceResult} />
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            <ProductTraceTimeline events={timelineEvents} />
          </div>
        </div>
      )}

      {/* Help Section */}
      {!searchedSerial && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Route className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">How to Use Product Tracing</h3>
              <div className="max-w-2xl mx-auto text-sm text-muted-foreground space-y-2">
                <p>• Enter a serial number, IMEI, or barcode in the search box above</p>
                <p>• View complete product lifecycle from acquisition to sale</p>
                <p>• See detailed timeline of all product changes and transactions</p>
                <p>• Access sale information and customer details (if sold)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}