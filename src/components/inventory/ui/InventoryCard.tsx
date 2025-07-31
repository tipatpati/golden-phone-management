import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryCardProps {
  title: string;
  description?: string;
  stock: number;
  threshold: number;
  price: number;
  category?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable inventory card component for displaying product information
 * Provides consistent styling and behavior across inventory views
 */
export function InventoryCard({
  title,
  description,
  stock,
  threshold,
  price,
  category,
  onEdit,
  onDelete,
  className,
  children
}: InventoryCardProps) {
  const isLowStock = stock <= threshold;
  const isOutOfStock = stock === 0;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Stock Status Indicator */}
      {isOutOfStock && (
        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Out of Stock
          </Badge>
        </div>
      )}
      {isLowStock && !isOutOfStock && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="border-amber-500 text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">{title}</CardTitle>
            {description && (
              <CardDescription className="line-clamp-2">{description}</CardDescription>
            )}
          </div>
        </div>
        
        {category && (
          <Badge variant="secondary" className="w-fit">
            {category}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stock and Price Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Stock: {stock}
            </span>
            {isLowStock && (
              <span className="text-xs text-muted-foreground">
                (Threshold: {threshold})
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-primary">
            €{price.toFixed(2)}
          </div>
        </div>

        {/* Progress Bar for Stock Level */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Stock Level</span>
            <span>{Math.min(100, (stock / Math.max(threshold * 2, 1)) * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isOutOfStock ? "bg-destructive" : 
                isLowStock ? "bg-amber-500" : "bg-primary"
              )}
              style={{
                width: `${Math.min(100, Math.max(5, (stock / Math.max(threshold * 2, 1)) * 100))}%`
              }}
            />
          </div>
        </div>

        {/* Custom Content */}
        {children}

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}