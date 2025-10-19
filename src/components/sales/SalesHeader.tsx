import React from "react";
import { NewSaleDialog } from "./NewSaleDialog";
import { PageHeader } from "@/components/common/PageHeader";

export function SalesHeader() {
  return (
    <PageHeader
      title="Gestione Garentille"
      subtitle="Gestisci le transazioni di garentille, elabora i rimborsi e monitora le prestazioni con analisi complete."
      actions={<NewSaleDialog />}
    />
  );
}