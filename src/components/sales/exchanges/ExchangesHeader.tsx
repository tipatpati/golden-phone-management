import React from "react";
import { NewExchangeDialog } from "../NewExchangeDialog";
import { PageHeader } from "@/components/common/PageHeader";

export function ExchangesHeader() {
  return (
    <PageHeader
      title="Gestione Cambi"
      subtitle="Gestisci transazioni di cambio, permuta usato e monitora le operazioni"
      actions={
        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
          <NewExchangeDialog />
        </div>
      }
    />
  );
}
