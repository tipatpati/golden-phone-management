import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { BulkDeleteSalesDialog } from "./BulkDeleteSalesDialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BulkSalesActionsToolbarProps {
  selectedCount: number;
  selectedSales: any[];
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function BulkSalesActionsToolbar({
  selectedCount,
  selectedSales,
  onClearSelection,
  onBulkDelete,
  isLoading = false,
  className
}: BulkSalesActionsToolbarProps) {
  const { userRole } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Only show for super admins
  if (userRole !== 'super_admin' || selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg",
        "animate-in slide-in-from-top-2 duration-200",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {selectedCount === 1 ? 'sale' : 'sales'} selected
            </span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete All Selected
            </Button>
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

      <BulkDeleteSalesDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedCount={selectedCount}
        selectedSales={selectedSales}
        onConfirm={async () => {
          await onBulkDelete();
          setShowDeleteDialog(false);
        }}
        isLoading={isLoading}
      />
    </>
  );
}