import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/updated-dialog';
import { Button } from '@/components/ui/updated-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/updated-card';
import { Separator } from '@/components/ui/separator';
import { Eye, User, Building, Mail, Phone, MapPin, CreditCard, CalendarDays, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Client } from '@/services';

interface ClientDetailsDialogProps {
  client: Client;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClientDetailsDialog({ client, trigger, open: controlledOpen, onOpenChange }: ClientDetailsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

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
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {client.type === "business" ? (
              <Building className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
            Dettagli Cliente - {getClientDisplayName(client)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {client.type === "business" ? (
                  <Building className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
                Informazioni Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Nome</div>
                  <div className="font-medium">{getClientDisplayName(client)}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Tipo</div>
                  <Badge variant="outline" className="border-primary/20 text-primary">
                    {client.type === 'business' ? 'Business (B2B)' : 'Individuale (B2C)'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Stato</div>
                  <Badge variant={getStatusColor(client.status)}>
                    {client.status === 'active' ? 'Attivo' : 'Inattivo'}
                  </Badge>
                </div>

                {client.type === "business" && client.contact_person && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Persona di Contatto</div>
                    <div>{client.contact_person}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Informazioni di Contatto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.email && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <div>{client.email}</div>
                  </div>
                )}

                {client.phone && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefono
                    </div>
                    <div>{client.phone}</div>
                  </div>
                )}

                {client.address && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Indirizzo
                    </div>
                    <div>{client.address}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(client.tax_id || client.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informazioni Aggiuntive
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.tax_id && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Partita IVA
                      </div>
                      <div>{client.tax_id}</div>
                    </div>
                  )}

                  {client.notes && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-muted-foreground">Note</div>
                      <div className="text-sm bg-muted/50 p-3 rounded-lg">{client.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Informazioni di Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Creato il</div>
                  <div>{client.created_at ? format(new Date(client.created_at), "dd/MM/yyyy HH:mm") : "N/A"}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Ultimo Aggiornamento</div>
                  <div>{client.updated_at ? format(new Date(client.updated_at), "dd/MM/yyyy HH:mm") : "N/A"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}