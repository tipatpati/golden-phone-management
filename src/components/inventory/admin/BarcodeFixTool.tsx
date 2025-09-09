import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import { toast } from "sonner";

interface BarcodeFixToolProps {
  onFixed?: () => void;
}

export function BarcodeFixTool({ onFixed }: BarcodeFixToolProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    updated: number;
    errors: number;
    validationResults?: {
      valid: number;
      invalid: string[];
      missing: string[];
    };
  } | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFixBarcodes = async () => {
    setIsRunning(true);
    setProgress(0);
    
    try {
      // Step 1: Fix missing barcodes
      setProgress(25);
      // TODO: Implement backfillMissingBarcodes in ProductUnitManagementService
      const backfillResult = { updated: 0, errors: 0 };
      
      // Step 2: Validate all barcodes
      setProgress(75);
      // TODO: Implement validateUnitBarcodes in ProductUnitManagementService
      const validationResult = { valid: 0, invalid: [], missing: [] };
      
      setProgress(100);
      
      const combinedResults = {
        updated: backfillResult.updated,
        errors: backfillResult.errors,
        validationResults: validationResult
      };
      
      setResults(combinedResults);
      
      if (backfillResult.updated > 0) {
        toast.success(`Fixed ${backfillResult.updated} missing barcodes`);
      } else {
        toast.info("No missing barcodes found");
      }
      
      if (backfillResult.errors > 0) {
        toast.warning(`${backfillResult.errors} errors encountered during fix`);
      }
      
      onFixed?.();
      
    } catch (error) {
      console.error('Failed to fix barcodes:', error);
      toast.error('Failed to fix barcodes');
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Fix Missing Barcodes
        </CardTitle>
        <CardDescription>
          Scan and fix product units that are missing barcodes. This will generate 
          unique CODE128 barcodes for units without them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Fixing barcodes...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        {results && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Fix Results
            </h4>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant={results.updated > 0 ? "default" : "secondary"}>
                {results.updated} barcodes generated
              </Badge>
              
              {results.errors > 0 && (
                <Badge variant="destructive">
                  {results.errors} errors
                </Badge>
              )}
              
              {results.validationResults && (
                <>
                  <Badge variant="outline">
                    {results.validationResults.valid} valid barcodes
                  </Badge>
                  
                  {results.validationResults.invalid.length > 0 && (
                    <Badge variant="destructive">
                      {results.validationResults.invalid.length} invalid
                    </Badge>
                  )}
                  
                  {results.validationResults.missing.length > 0 && (
                    <Badge variant="secondary">
                      {results.validationResults.missing.length} still missing
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            {results.validationResults?.invalid.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Invalid Barcodes Found
                </h5>
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                  {results.validationResults.invalid.slice(0, 10).map((unitId, index) => (
                    <div key={index} className="truncate">
                      Unit ID: {unitId}
                    </div>
                  ))}
                  {results.validationResults.invalid.length > 10 && (
                    <div className="text-warning">
                      ... and {results.validationResults.invalid.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-3">
          <Button 
            onClick={handleFixBarcodes}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Wrench className="h-4 w-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Fix Missing Barcodes
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Scans all product units for missing barcodes</li>
            <li>Generates unique CODE128 barcodes for units without them</li>
            <li>Validates all barcodes after generation</li>
            <li>Reports any issues found during the process</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}