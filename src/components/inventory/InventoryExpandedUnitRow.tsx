import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hash, Barcode, Info, Printer, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Unit {
  id: string;
  serial_number: string;
  barcode?: string;
  color?: string;
  storage?: number;
  ram?: number;
  status: string;
  max_price?: number;
  price?: number;
  condition?: string;
}

interface InventoryExpandedUnitRowProps {
  unit: Unit;
  isMatched: boolean;
  searchTerm?: string;
  onViewDetails: (unit: Unit) => void;
  onPrint: (unitId: string) => void;
  onEdit: (unit: Unit) => void;
  onDelete: (unitId: string) => void;
}

export const InventoryExpandedUnitRow = React.memo(({
  unit,
  isMatched,
  searchTerm = "",
  onViewDetails,
  onPrint,
  onEdit,
  onDelete
}: InventoryExpandedUnitRowProps) => {
  const searchLower = searchTerm.toLowerCase();

  return (
    <TableRow
      className={cn(
        "bg-muted/20 border-l-4",
        isMatched ? "border-l-blue-500 bg-blue-50/50" : "border-l-transparent"
      )}
    >
      <TableCell></TableCell>
      <TableCell colSpan={2}>
        <div className="pl-8 space-y-1">
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span className={cn(
              "text-sm font-mono",
              isMatched && "font-semibold text-blue-700"
            )}>
              {unit.serial_number}
            </span>
            {isMatched && (
              <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                Match
              </Badge>
            )}
          </div>
          {unit.barcode && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Barcode className="h-3 w-3" aria-hidden="true" />
              <span className={cn(
                "font-mono",
                isMatched && unit.barcode.toLowerCase().includes(searchLower) && "font-semibold text-blue-700"
              )}>
                {unit.barcode}
              </span>
            </div>
          )}
          {(unit.color || unit.storage || unit.ram) && (
            <div className="flex gap-2 text-xs">
              {unit.color && <Badge variant="outline">{unit.color}</Badge>}
              {unit.storage && <Badge variant="outline">{unit.storage}GB</Badge>}
              {unit.ram && <Badge variant="outline">{unit.ram}GB RAM</Badge>}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            unit.status === 'available' ? 'bg-green-100 text-green-800' :
            unit.status === 'sold' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          )}
        >
          {unit.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {unit.max_price ? (
            <span className="font-medium text-green-600">
              €{unit.max_price.toFixed(2)}
            </span>
          ) : unit.price ? (
            <span className="text-muted-foreground">
              €{unit.price.toFixed(2)}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {unit.condition && (
          <Badge variant="outline" className="text-xs">
            {unit.condition}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1" role="group" aria-label="Unit actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(unit);
            }}
            className="h-7 w-7 p-0"
            aria-label={`View details for unit ${unit.serial_number}`}
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPrint(unit.id);
            }}
            className="h-7 w-7 p-0"
            aria-label={`Print barcode for unit ${unit.serial_number}`}
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(unit);
            }}
            className="h-7 w-7 p-0"
            aria-label={`Edit unit ${unit.serial_number}`}
          >
            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(unit.id);
            }}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            disabled={unit.status === 'sold'}
            aria-label={`Delete unit ${unit.serial_number}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

InventoryExpandedUnitRow.displayName = 'InventoryExpandedUnitRow';
