import React from "react";
import { NewSaleDialog } from "./NewSaleDialog";
import { PageHeader } from "@/components/common/PageHeader";

export function SalesHeader() {
  return (
    <PageHeader
      title="Gestione Garanzie"
      subtitle="Gestisci le transazioni di garanzie, elabora i rimborsi e monitora le prestazioni con analisi complete."
      actions={
        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
          <NewSaleDialog />
        </div>
      }
    />
  );
}