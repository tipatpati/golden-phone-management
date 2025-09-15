
import React from "react";
import { Card, CardContent } from "@/components/ui/updated-card";
import { Users } from "lucide-react";
import { NewClientDialog } from "./NewClientDialog";

interface EmptyClientsListProps {
  searchTerm: string;
}

export const EmptyClientsList = ({ searchTerm }: EmptyClientsListProps) => {
  return (
    <Card className="border-0 shadow-xl bg-background">
      <CardContent className="p-12">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {searchTerm ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              {searchTerm 
                ? "Try adjusting your search criteria or clear the search to see all clients." 
                : "Get started by adding your first client."
              }
            </p>
          </div>
          {!searchTerm && <NewClientDialog />}
        </div>
      </CardContent>
    </Card>
  );
};
