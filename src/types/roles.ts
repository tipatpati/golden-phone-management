
// Import the Database type to get the exact enum values from Supabase
import { Database } from "@/integrations/supabase/types";

// Use the exact enum type from Supabase
export type UserRole = Database['public']['Enums']['app_role'];

export interface RoleConfig {
  name: string;
  description: string;
  features: string[];
  permissions: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    name: "Super Amministratore",
    description: "Accesso completo a tutte le funzionalità incluse quelle finanziarie",
    features: [
      "gestione_completa_inventario",
      "analisi_e_report_completi", 
      "gestione_utenti",
      "impostazioni_sistema",
      "gestione_vendite",
      "gestione_riparazioni",
      "gestione_clienti",
      "gestione_finanziaria"
    ],
    permissions: ["*"]
  },
  admin: {
    name: "Amministratore",
    description: "Accesso completo a tutte le funzionalità del sistema (escluse finanze)",
    features: [
      "gestione_completa_inventario",
      "analisi_e_report_completi", 
      "gestione_utenti",
      "impostazioni_sistema",
      "gestione_vendite",
      "gestione_riparazioni",
      "gestione_clienti"
    ],
    permissions: ["*"]
  },
  manager: {
    name: "Manager",
    description: "Supervisiona le operazioni del negozio e gestisce il team",
    features: [
      "supervisione_vendite",
      "gestione_inventario",
      "report_giornalieri",
      "gestione_riparazioni",
      "gestione_clienti"
    ],
    permissions: ["sales", "inventory", "repairs", "clients", "reports"]
  },
  inventory_manager: {
    name: "Responsabile Magazzino",
    description: "Gestisce scorte, ordini e livelli di inventario",
    features: [
      "gestione_inventario",
      "monitoraggio_scorte",
      "gestione_ordini",
      "report_inventario"
    ],
    permissions: ["inventory", "dashboard"]
  },
  technician: {
    name: "Tecnico",
    description: "Gestisce riparazioni e assistenza tecnica",
    features: [
      "gestione_riparazioni",
      "gestione_clienti",
      "consultazione_inventario",
      "dashboard_riparazioni"
    ],
    permissions: ["repairs", "clients", "dashboard"]
  },
  salesperson: {
    name: "Addetto Vendite",
    description: "Gestisce vendite e interazioni con i clienti",
    features: [
      "elaborazione_vendite",
      "gestione_clienti",
      "consultazione_inventario",
      "dashboard_vendite"
    ],
    permissions: ["sales", "clients", "dashboard"]
  }
};
