import * as React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

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
  const isMobile = useIsMobile()
  const startItem = pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems)

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface border-t border-border",
      className
    )}>
      {/* Rows per page selector */}
      <div className="flex items-center gap-2 order-2 sm:order-1">
        <span className="text-sm text-on-surface-variant whitespace-nowrap">Rows per page:</span>
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
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 order-1 sm:order-2 w-full sm:w-auto">
        {/* Page info */}
        <span className="text-sm text-on-surface-variant whitespace-nowrap">
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
          
          {/* Page numbers - responsive display */}
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(isMobile ? 3 : 5, pageCount) }, (_, i) => {
              let pageNumber: number
              const maxVisible = isMobile ? 3 : 5
              if (pageCount <= maxVisible) {
                pageNumber = i
              } else if (pageIndex <= Math.floor(maxVisible / 2)) {
                pageNumber = i
              } else if (pageIndex >= pageCount - Math.ceil(maxVisible / 2)) {
                pageNumber = pageCount - maxVisible + i
              } else {
                pageNumber = pageIndex - Math.floor(maxVisible / 2) + i
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