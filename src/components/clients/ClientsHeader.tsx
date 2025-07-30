
import React from "react";
import { NewClientDialog } from "./NewClientDialog";

export const ClientsHeader = () => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestione Clienti
          </h2>
          <p className="text-muted-foreground mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg">
            Gestisci clienti privati e aziendali, traccia gli acquisti e le informazioni di contatto.
          </p>
        </div>
        <NewClientDialog />
      </div>
    </div>
  );
};
