import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useCreateClient } from "@/services/useClients";
import { useForm } from "@/hooks/useForm";
import { CreateClientSchema, ClientFormData } from "@/schemas/validation";
import { useErrorHandler } from "@/utils/errorHandler";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);
  
  const createClient = useCreateClient();
  const { handleError } = useErrorHandler('NewClientDialog');
  
  // Form with validation
  const form = useForm<ClientFormData>(
    {
      type: 'individual',
      first_name: '',
      last_name: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      notes: '',
      status: 'active'
    },
    CreateClientSchema,
    'NewClientDialog'
  );

  const handleSubmit = async () => {
    await form.handleSubmit(
      async (data) => {
        await createClient.mutateAsync({
          ...data,
          type: data.type as 'individual' | 'business',
          status: data.status || 'active'
        });
        setOpen(false);
      },
      () => {
        // Success - form automatically resets
      },
      (error) => {
        handleError(error, 'createClient');
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Cliente</DialogTitle>
        </DialogHeader>
        
        <Tabs value={form.data.type} onValueChange={(value) => form.updateField('type', value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Privato (B2C)</TabsTrigger>
            <TabsTrigger value="business">Azienda (B2B)</TabsTrigger>
          </TabsList>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 mt-4">
            <TabsContent value="individual" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome *</Label>
                  <Input
                    id="first_name"
                    value={form.data.first_name || ''}
                    onChange={(e) => form.updateField('first_name', e.target.value)}
                    required
                  />
                  {form.getFieldError('first_name') && (
                    <p className="text-sm text-destructive">{form.getFieldError('first_name')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Cognome *</Label>
                  <Input
                    id="last_name"
                    value={form.data.last_name || ''}
                    onChange={(e) => form.updateField('last_name', e.target.value)}
                    required
                  />
                  {form.getFieldError('last_name') && (
                    <p className="text-sm text-destructive">{form.getFieldError('last_name')}</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="business" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Ragione Sociale *</Label>
                <Input
                  id="company_name"
                  value={form.data.company_name || ''}
                  onChange={(e) => form.updateField('company_name', e.target.value)}
                  required
                />
                {form.getFieldError('company_name') && (
                  <p className="text-sm text-destructive">{form.getFieldError('company_name')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Persona di Contatto</Label>
                <Input
                  id="contact_person"
                  value={form.data.contact_person || ''}
                  onChange={(e) => form.updateField('contact_person', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Partita IVA</Label>
                <Input
                  id="tax_id"
                  value={form.data.tax_id || ''}
                  onChange={(e) => form.updateField('tax_id', e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.data.email || ''}
                  onChange={(e) => form.updateField('email', e.target.value)}
                />
                {form.getFieldError('email') && (
                  <p className="text-sm text-destructive">{form.getFieldError('email')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={form.data.phone || ''}
                  onChange={(e) => form.updateField('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={form.data.address || ''}
                onChange={(e) => form.updateField('address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={form.data.notes || ''}
                onChange={(e) => form.updateField('notes', e.target.value)}
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={form.isLoading || !form.isValid}
              >
                {form.isLoading ? "Creazione..." : "Crea Cliente"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}