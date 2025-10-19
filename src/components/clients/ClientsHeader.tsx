import React from "react";
import { NewClientDialog } from "./NewClientDialog";
import { PageHeader } from "@/components/common/PageHeader";

export const ClientsHeader = () => {
  return (
    <PageHeader
      title="Gestione Clienti"
      subtitle="Gestisci clienti privati e aziendali, traccia gli acquisti e le informazioni di contatto."
      actions={<NewClientDialog />}
    />
  );
};
