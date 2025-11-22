import React, { memo } from 'react';

// Pagination component for better performance
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

export const TablePagination = memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize, 
  totalItems 
}: PaginationProps) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface border-t">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      
      <div className="flex items-center gap-2 relative z-20">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 sm:px-3 sm:py-1.5 min-h-[44px] sm:min-h-[36px] text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target-enhanced"
        >
          Previous
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 sm:px-3 sm:py-1.5 min-h-[44px] sm:min-h-[36px] text-sm border rounded transition-all touch-target-enhanced ${
                  currentPage === page 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-muted hover:shadow-sm'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 sm:px-3 sm:py-1.5 min-h-[44px] sm:min-h-[36px] text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target-enhanced"
        >
          Next
        </button>
      </div>
    </div>
  );
});

TablePagination.displayName = 'TablePagination';