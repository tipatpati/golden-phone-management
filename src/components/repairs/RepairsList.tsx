
import React from "react";
import { Card, CardContent } from "@/components/ui/enhanced-card";
import { RepairCard, type Repair } from "./RepairCard";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

interface RepairsListProps {
  repairs: Repair[];
}

export const RepairsList = React.memo<RepairsListProps>(function RepairsList({ repairs }) {
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    totalItems
  } = usePagination({ data: repairs, itemsPerPage: 17 });

  if (repairs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nessuna riparazione trovata che corrisponda alla tua ricerca.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {paginatedData.map((repair, index) => (
        <div 
          key={repair.id} 
          className="md-enter"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'both'
          }}
        >
          <RepairCard repair={repair} />
        </div>
      ))}
      
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
});
