import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { NewSaleDialog } from "./NewSaleDialog";

interface EmptySalesListProps {
  searchTerm: string;
}

export function EmptySalesList({ searchTerm }: EmptySalesListProps) {
  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardContent className="p-12">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {searchTerm ? "No sales found" : "No sales yet"}
            </h3>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              {searchTerm 
                ? "Try adjusting your search criteria or clear the search to see all sales." 
                : "Get started by creating your first sale transaction."
              }
            </p>
          </div>
          {!searchTerm && (
            <NewSaleDialog />
          )}
        </div>
      </CardContent>
    </Card>
  );
}