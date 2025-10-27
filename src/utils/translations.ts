// Translation utilities for Italian localization
export const translations = {
  // Common actions
  add: "Aggiungi",
  create: "Crea",
  edit: "Modifica",
  delete: "Elimina",
  save: "Salva",
  cancel: "Annulla",
  submit: "Invia",
  search: "Cerca",
  filter: "Filtra",
  view: "Visualizza",
  manage: "Gestisci",
  loading: "Caricamento...",
  
  // Status
  active: "Attivo",
  inactive: "Inattivo",
  pending: "In attesa",
  completed: "Completato",
  cancelled: "Annullato",
  
  // Common fields
  name: "Nome",
  email: "Email",
  phone: "Telefono",
  address: "Indirizzo",
  status: "Stato",
  priority: "Priorità",
  date: "Data",
  notes: "Note",
  description: "Descrizione",
  
  // Business terms
  client: "Cliente",
  clients: "Clienti",
  product: "Prodotto",
  products: "Prodotti",
  sale: "Garanzia",
  sales: "Vendite",
  repair: "Riparazione",
  repairs: "Riparazioni",
  inventory: "Inventario",
  employee: "Dipendente",
  employees: "Dipendenti",
  supplier: "Fornitore",
  suppliers: "Fornitori",
  
  // Financial
  price: "Prezzo",
  total: "Totale",
  subtotal: "Subtotale",
  discount: "Sconto",
  tax: "IVA",
  amount: "Importo",
  
  // Payment methods
  cash: "Contanti",
  card: "Carta",
  bankTransfer: "Bonifico Bancario",
  hybrid: "Pagamento Ibrido",
  other: "Altro",
  
  // Messages
  success: {
    created: "creato con successo",
    updated: "aggiornato con successo",
    deleted: "eliminato con successo",
  },
  error: {
    create: "Errore nella creazione",
    update: "Errore nell'aggiornamento",
    delete: "Errore nell'eliminazione",
    required: "Campo obbligatorio",
  }
};

// Currency formatting utility
export const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

// Percentage formatting utility
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};