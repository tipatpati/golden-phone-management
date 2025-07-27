
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ImportResult {
  success: boolean;
  processed: number;
  imported: number;
  errors: string[];
}

export function ProductImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'insert' | 'update'>('upsert');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        toast.error('Invalid file type. Please select a CSV or Excel file.');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast.error('Please log in to import products');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', importMode);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(
        `https://joiwowvlujajwbarpsuc.supabase.co/functions/v1/product-bulk-operations?operation=import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      setResult(data);
      
      if (data.success) {
        toast.success(`Successfully imported ${data.imported} products`);
      } else {
        toast.error('Import completed with errors');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
      setResult({
        success: false,
        processed: 0,
        imported: 0,
        errors: [error.message]
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast.error('Please log in to download template');
        return;
      }

      const response = await fetch(
        `https://joiwowvlujajwbarpsuc.supabase.co/functions/v1/product-bulk-operations?operation=template`,
        {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Template downloaded successfully');
    } catch (error: any) {
      console.error('Template download error:', error);
      toast.error(`Failed to download template: ${error.message}`);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setImportMode('upsert');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={resetDialog} className="text-center justify-center">
          <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
          Import Products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Products from Excel/CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Need a template?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download our Excel template with sample data and instructions.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
          </div>

          {/* File Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: CSV, Excel (.xlsx, .xls). Max size: 10MB
              </p>
            </div>

            {file && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Import Mode */}
          <div>
            <Label htmlFor="import-mode">Import Mode</Label>
            <Select value={importMode} onValueChange={(value: any) => setImportMode(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upsert">
                  <div>
                    <div className="font-medium">Upsert (Recommended)</div>
                    <div className="text-sm text-muted-foreground">Insert new products, update existing ones</div>
                  </div>
                </SelectItem>
                <SelectItem value="insert">
                  <div>
                    <div className="font-medium">Insert Only</div>
                    <div className="text-sm text-muted-foreground">Only add new products, skip duplicates</div>
                  </div>
                </SelectItem>
                <SelectItem value="update">
                  <div>
                    <div className="font-medium">Update Only</div>
                    <div className="text-sm text-muted-foreground">Only update existing products</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <Alert className={result.success ? "border-green-200" : "border-red-200"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'Import Completed' : 'Import Completed with Errors'}
                  </span>
                </div>
                <AlertDescription className="mt-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Processed: <strong>{result.processed}</strong></div>
                    <div>Imported: <strong>{result.imported}</strong></div>
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="space-y-1 text-sm text-red-700">
                    {result.errors.slice(0, 20).map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-400">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                    {result.errors.length > 20 && (
                      <li className="text-red-600 italic">
                        ... and {result.errors.length - 20} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? 'Importing...' : 'Import Products'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
