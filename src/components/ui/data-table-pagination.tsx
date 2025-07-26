import * as React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTablePaginationProps {
  pageIndex: number
  pageSize: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  className?: string
}

export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  canPreviousPage,
  canNextPage,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className,
}: DataTablePaginationProps) {
  const startItem = pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems)

  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-surface border-t border-border",
      className
    )}>
      {/* Rows per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-on-surface-variant">Rows per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page info and navigation */}
      <div className="flex items-center gap-6">
        {/* Page info */}
        <span className="text-sm text-on-surface-variant">
          {startItem}-{endItem} of {totalItems}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="text"
            size="icon"
            onClick={() => onPageChange(0)}
            disabled={!canPreviousPage}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="text"
            size="icon"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPreviousPage}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Page numbers - show current and surrounding pages */}
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              let pageNumber: number
              if (pageCount <= 5) {
                pageNumber = i
              } else if (pageIndex <= 2) {
                pageNumber = i
              } else if (pageIndex >= pageCount - 3) {
                pageNumber = pageCount - 5 + i
              } else {
                pageNumber = pageIndex - 2 + i
              }

              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === pageIndex ? "filled" : "text"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className="h-8 w-8"
                >
                  {pageNumber + 1}
                </Button>
              )
            })}
          </div>

          <Button
            variant="text"
            size="icon"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNextPage}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="text"
            size="icon"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={!canNextPage}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}