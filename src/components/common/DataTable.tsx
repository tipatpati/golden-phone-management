import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

interface Action<T> {
  icon: React.ReactNode;
  label: string;
  onClick: (item: T) => void;
  variant?: "ghost" | "outline" | "destructive";
  className?: string;
  renderCustom?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  getRowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  actions = [],
  getRowKey,
  onRowClick,
  className = ""
}: DataTableProps<T>) {
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({ data, itemsPerPage: 17 });

  return (
    <div className={`bg-surface rounded-xl border border-outline overflow-hidden ${className}`}>
      {/* Table Header - Desktop Only */}
      <div className="hidden lg:block bg-surface-container border-b border-outline">
        <div className="grid gap-3 px-4 py-4 text-sm font-medium text-on-surface-variant" 
             style={{ 
               gridTemplateColumns: `${columns.map((col) => 
                 col.header === '' ? '48px' : '1fr'
               ).join(' ')} ${actions.length > 0 ? '140px' : ''}`
             }}>
          {columns.map((column) => (
            <div 
              key={String(column.key)} 
              className={`flex items-center ${
                column.align === 'center' ? 'justify-center' : 
                column.align === 'right' ? 'justify-end' : 'justify-start'
              } ${column.className || ''}`}
            >
              {column.header}
            </div>
          ))}
          {actions.length > 0 && (
            <div className="flex items-center justify-end">Actions</div>
          )}
        </div>
      </div>

      {/* Table Body - Desktop Only */}
      <div className="hidden lg:block divide-y divide-outline">
        {paginatedData.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          paginatedData.map((item) => (
            <div
              key={getRowKey(item)}
              className={`grid gap-3 px-4 py-4 hover:bg-surface-container-high transition-colors items-center ${onRowClick ? 'cursor-pointer' : ''}`}
              style={{ 
                gridTemplateColumns: `${columns.map((col) => 
                  col.header === '' ? '48px' : '1fr'
                ).join(' ')} ${actions.length > 0 ? '140px' : ''}`,
                minHeight: '72px'
              }}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column) => (
                <div
                  key={String(column.key)}
                  className={`flex items-center overflow-hidden ${
                    column.align === 'center' ? 'justify-center' : 
                    column.align === 'right' ? 'justify-end' : 'justify-start'
                  } ${column.className || ''}`}
                >
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key] || '-')
                  }
                </div>
              ))}
              
              {actions.length > 0 && (
                <div className="flex justify-end items-center gap-1">
                  {actions.map((action, index) => 
                    action.renderCustom ? (
                      <div key={index}>
                        {action.renderCustom(item)}
                      </div>
                    ) : (
                      <Button
                        key={index}
                        variant={action.variant || "ghost"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${action.className || ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          logger.debug('DataTable action clicked', { action: action.label, item }, 'DataTable');
                          if (typeof action.onClick === 'function') {
                            action.onClick(item);
                          }
                        }}
                        title={action.label}
                      >
                        {action.icon}
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          pageSize={17}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}