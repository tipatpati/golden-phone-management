import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Edit3, 
  Package, 
  MoreHorizontal,
  X,
  Archive,
  RotateCcw,
  Printer
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkDeleteDialog } from "./dialogs/BulkDeleteDialog";
import { BulkEditDialog } from "./dialogs/BulkEditDialog";
import { BulkPrintDialog } from "./dialogs/BulkPrintDialog";
import { cn } from "@/lib/utils";

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedProducts: any[];
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkUpdateStatus: (status: string) => Promise<void>;
  onBulkUpdateCategory: (categoryId: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedProducts,
  onClearSelection,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkUpdateCategory,
  isLoading = false,
  className
}: BulkActionsToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg",
        "animate-in slide-in-from-top-2 duration-200",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {selectedCount === 1 ? 'product' : 'products'} selected
            </span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              disabled={isLoading}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintDialog(true)}
              disabled={isLoading}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print Labels
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Status Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onBulkUpdateStatus('active')}>
                  <Package className="h-4 w-4 mr-2" />
                  Mark as Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateStatus('inactive')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Mark as Inactive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateStatus('discontinued')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Mark as Discontinued
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Category Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(1)}>
                  <Package className="h-4 w-4 mr-2" />
                  Move to Phones
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(2)}>
                  <Package className="h-4 w-4 mr-2" />
                  Move to Accessories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(3)}>
                  <Package className="h-4 w-4 mr-2" />
                  Move to Tablets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(4)}>
                  <Package className="h-4 w-4 mr-2" />
                  Move to Laptops
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <BulkDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedCount={selectedCount}
        onConfirm={async () => {
          await onBulkDelete();
          setShowDeleteDialog(false);
        }}
        isLoading={isLoading}
      />

      <BulkEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        selectedCount={selectedCount}
        onSave={async (updates) => {
          if (updates.status) {
            await onBulkUpdateStatus(updates.status);
          }
          if (updates.category_id) {
            await onBulkUpdateCategory(updates.category_id);
          }
          setShowEditDialog(false);
        }}
        isLoading={isLoading}
      />

      <BulkPrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        products={selectedProducts}
        isLoading={isLoading}
      />
    </>
  );
}