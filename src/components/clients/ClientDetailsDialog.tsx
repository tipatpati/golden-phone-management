import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/updated-dialog";
import { Button } from "@/components/ui/updated-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailsCard, DetailField } from "@/components/ui/details-card";
import { Eye, User, Mail, Phone, MapPin, Calendar, Hash, Building2, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Client } from "@/services";

interface ClientDetailsDialogProps {
  client: Client;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClientDetailsDialog({ client, trigger, open: controlledOpen, onOpenChange }: ClientDetailsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const getClientDisplayName = (client: Client) => {
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outlined" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Visualizza Dettagli
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent size="lg" className="custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {client.type === "business" ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            Dettagli Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 sm:px-8 py-6">
          {/* Client Overview */}
          <DetailsCard 
            title="Informazioni Generali"
            icon={client.type === "business" ? Building2 : User}
            accentColor="primary"
            delay={0}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailField
                label="Nome"
                value={<span className="text-lg">{getClientDisplayName(client)}</span>}
              />
              <DetailField
                label="Tipo"
                value={
                  <StatusBadge status={client.type === "business" ? "info" : "default"}>
                    {client.type === "business" ? "Business (B2B)" : "Individuale (B2C)"}
                  </StatusBadge>
                }
              />
              <DetailField
                label="Stato"
                value={
                  <StatusBadge status={client.status === "active" ? "success" : "default"}>
                    {client.status === "active" ? "Attivo" : "Inattivo"}
                  </StatusBadge>
                }
              />
              {client.type === "business" && client.contact_person && (
                <DetailField
                  label="Persona di Contatto"
                  value={client.contact_person}
                  icon={User}
                />
              )}
            </div>
            
            {client.type === "business" && client.tax_id && (
              <div className="mt-4">
                <DetailField
                  label="Partita IVA"
                  value={<span className="font-mono">{client.tax_id}</span>}
                  copyable
                />
              </div>
            )}
          </DetailsCard>

          {/* Contact Information */}
          <DetailsCard 
            title="Informazioni di Contatto"
            icon={Mail}
            accentColor="success"
            delay={1}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {client.email && (
                <DetailField
                  label="Email"
                  value={client.email}
                  icon={Mail}
                  copyable
                />
              )}
              
              {client.phone && (
                <DetailField
                  label="Telefono"
                  value={client.phone}
                  icon={Phone}
                  copyable
                />
              )}
            </div>

            {client.address && (
              <DetailField
                label="Indirizzo"
                value={client.address}
                icon={MapPin}
                className="mt-4"
              />
            )}
          </DetailsCard>

          {/* Additional Information */}
          {(client.notes || client.tax_id) && (
            <DetailsCard 
              title="Informazioni Aggiuntive"
              icon={FileText}
              delay={2}
            >
              {client.tax_id && (
                <DetailField
                  label="Partita IVA"
                  value={<span className="font-mono">{client.tax_id}</span>}
                  copyable
                />
              )}
              
              {client.notes && (
                <div className={client.tax_id ? "mt-4" : ""}>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Note
                  </label>
                  <div className="glass-card bg-surface-container/40 p-4 mt-2">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{client.notes}</p>
                  </div>
                </div>
              )}
            </DetailsCard>
          )}

          {/* System Information */}
          <DetailsCard 
            title="Informazioni di Sistema"
            icon={Hash}
            delay={3}
            variant="outlined"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailField
                label="ID Cliente"
                value={<span className="font-mono text-xs">{client.id}</span>}
                icon={Hash}
                copyable
              />
              
              <DetailField
                label="Data Creazione"
                value={client.created_at ? format(new Date(client.created_at), "dd/MM/yyyy HH:mm") : "N/A"}
                icon={Calendar}
              />
            </div>
            
            {client.updated_at && (
              <DetailField
                label="Ultimo Aggiornamento"
                value={format(new Date(client.updated_at), "dd/MM/yyyy HH:mm")}
                icon={Calendar}
                className="mt-4"
              />
            )}
          </DetailsCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}