import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-collapse", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn("bg-surface-container border-b border-border", className)} 
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    interactive?: boolean
  }
>(({ className, interactive = true, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border h-14 md-state-change",
      interactive && "hover:bg-surface-container-high cursor-pointer md-state-layer",
      "data-[state=selected]:bg-primary-container",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean
    sortDirection?: 'asc' | 'desc' | null
    align?: 'left' | 'center' | 'right'
  }
>(({ className, sortable = false, sortDirection = null, align = 'left', children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-14 px-4 font-medium text-sm text-on-surface-variant border-b border-border bg-surface-container md-state-change",
      align === 'left' && "text-left",
      align === 'center' && "text-center", 
      align === 'right' && "text-right",
      sortable && "cursor-pointer hover:bg-surface-container-high select-none md-state-layer",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      {children}
      {sortable && (
        <div className="flex flex-col">
          <svg
            className={cn(
              "w-3 h-3 md-motion-short",
              sortDirection === 'asc' ? "text-primary" : "text-on-surface-variant opacity-50"
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg
            className={cn(
              "w-3 h-3 md-motion-short -mt-1",
              sortDirection === 'desc' ? "text-primary" : "text-on-surface-variant opacity-50"
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </th>
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    align?: 'left' | 'center' | 'right'
  }
>(({ className, align = 'left', ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3 align-middle text-sm text-on-surface",
      align === 'left' && "text-left",
      align === 'center' && "text-center",
      align === 'right' && "text-right",
      "[&:has([role=checkbox])]:pr-0", 
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
