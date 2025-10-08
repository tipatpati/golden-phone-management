import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/updated-dialog";
import { Button } from "@/components/ui/updated-button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit3, Save, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (updates: {
    status?: string;
    category_id?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  onSave,
  isLoading = false
}: BulkEditDialogProps) {
  const [status, setStatus] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");

  const handleSave = async () => {
    const updates: { status?: string; category_id?: number } = {};
    
    if (status) {
      updates.status = status;
    }
    
    if (categoryId) {
      updates.category_id = parseInt(categoryId);
    }

    if (Object.keys(updates).length === 0) {
      return; // No changes to save
    }

    await onSave(updates);
    
    // Reset form
    setStatus("");
    setCategoryId("");
  };

  const hasChanges = status || categoryId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
              <Edit3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                Edit {selectedCount} Products
              </DialogTitle>
              <DialogDescription>
                Make bulk changes to {selectedCount} selected {selectedCount === 1 ? 'product' : 'products'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Product Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="category">Product Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Phones</SelectItem>
                  <SelectItem value="2">Accessories</SelectItem>
                  <SelectItem value="3">Tablets</SelectItem>
                  <SelectItem value="4">Laptops</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Changes to apply:</p>
                <ul className="space-y-1 list-disc list-inside">
                  {status && (
                    <li>Status will be changed to: <span className="font-medium">{status.replace('_', ' ')}</span></li>
                  )}
                  {categoryId && (
                    <li>Category will be changed to: <span className="font-medium">
                      {categoryId === "1" ? "Phones" : 
                       categoryId === "2" ? "Accessories" : 
                       categoryId === "3" ? "Tablets" : "Laptops"}
                    </span></li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outlined"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}