
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RepairCard, type Repair } from "./RepairCard";

interface RepairsListProps {
  repairs: Repair[];
}

export const RepairsList: React.FC<RepairsListProps> = ({ repairs }) => {
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
      {repairs.map((repair) => (
        <RepairCard key={repair.id} repair={repair} />
      ))}
    </div>
  );
};
