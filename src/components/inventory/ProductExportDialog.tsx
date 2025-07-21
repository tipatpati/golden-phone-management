
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export function ProductExportDialog() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  const handleExport = async () => {
    setExporting(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast.error('Please log in to export products');
        return;
      }

      const response = await fetch(
        `https://joiwowvlujajwbarpsuc.supabase.co/functions/v1/product-bulk-operations?operation=export`,
        {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export products');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Products exported successfully');
      setOpen(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Products to Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              Export all products to an Excel file (.xlsx) with all product details, categories, and pricing information.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="timestamps" 
                checked={includeTimestamps}
                onCheckedChange={(checked) => setIncludeTimestamps(checked === true)}
              />
              <Label htmlFor="timestamps" className="text-sm">
                Include created/updated timestamps
              </Label>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">Export includes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All product information</li>
              <li>• Category names (human-readable)</li>
              <li>• Serial numbers (comma-separated)</li>
              <li>• Stock levels and thresholds</li>
              <li>• Pricing information</li>
              <li>• Supplier and barcode data</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
