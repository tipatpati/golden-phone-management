import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
}

const defaultTaxRates: TaxRate[] = [
  { id: "1", name: "IVA Standard", rate: 22, isDefault: true, isActive: true, description: "Aliquota IVA ordinaria" },
  { id: "2", name: "IVA Ridotta", rate: 10, isDefault: false, isActive: true, description: "Aliquota IVA ridotta" },
  { id: "3", name: "IVA Agevolata", rate: 4, isDefault: false, isActive: true, description: "Aliquota IVA agevolata" },
  { id: "4", name: "Esente IVA", rate: 0, isDefault: false, isActive: true, description: "Operazioni esenti da IVA" },
];

export function TaxConfiguration() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>(defaultTaxRates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTax, setNewTax] = useState({ name: "", rate: 0, description: "" });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleSave = (tax: TaxRate) => {
    setTaxRates(rates => 
      rates.map(r => r.id === tax.id ? tax : r)
    );
    setEditingId(null);
    toast({
      title: "Successo",
      description: "Aliquota fiscale aggiornata con successo",
    });
  };

  const handleDelete = (id: string) => {
    const taxToDelete = taxRates.find(t => t.id === id);
    if (taxToDelete?.isDefault) {
      toast({
        title: "Errore",
        description: "Non è possibile eliminare l'aliquota predefinita",
        variant: "destructive",
      });
      return;
    }
    
    setTaxRates(rates => rates.filter(r => r.id !== id));
    toast({
      title: "Successo",
      description: "Aliquota fiscale eliminata con successo",
    });
  };

  const handleAddNew = () => {
    if (!newTax.name || newTax.rate < 0 || newTax.rate > 100) {
      toast({
        title: "Errore",
        description: "Inserisci un nome valido e un'aliquota tra 0 e 100",
        variant: "destructive",
      });
      return;
    }

    const newTaxRate: TaxRate = {
      id: Date.now().toString(),
      name: newTax.name,
      rate: newTax.rate,
      isDefault: false,
      isActive: true,
      description: newTax.description,
    };

    setTaxRates(rates => [...rates, newTaxRate]);
    setNewTax({ name: "", rate: 0, description: "" });
    setIsAdding(false);
    toast({
      title: "Successo",
      description: "Nuova aliquota fiscale aggiunta con successo",
    });
  };

  const setAsDefault = (id: string) => {
    setTaxRates(rates => 
      rates.map(r => ({ ...r, isDefault: r.id === id }))
    );
    toast({
      title: "Successo",
      description: "Aliquota predefinita aggiornata",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-on-surface">Configurazione Tasse</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Aliquota
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Nuova Aliquota Fiscale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-name">Nome</Label>
                <Input
                  id="new-name"
                  value={newTax.name}
                  onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                  placeholder="es. IVA Speciale"
                />
              </div>
              <div>
                <Label htmlFor="new-rate">Aliquota (%)</Label>
                <Input
                  id="new-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newTax.rate}
                  onChange={(e) => setNewTax({ ...newTax, rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="new-description">Descrizione</Label>
                <Input
                  id="new-description"
                  value={newTax.description}
                  onChange={(e) => setNewTax({ ...newTax, description: e.target.value })}
                  placeholder="Descrizione opzionale"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddNew}>
                <Save className="h-4 w-4 mr-2" />
                Salva
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {taxRates.map((tax) => (
          <TaxRateCard 
            key={tax.id}
            tax={tax}
            isEditing={editingId === tax.id}
            onEdit={() => setEditingId(tax.id)}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
            onDelete={() => handleDelete(tax.id)}
            onSetDefault={() => setAsDefault(tax.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface TaxRateCardProps {
  tax: TaxRate;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (tax: TaxRate) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function TaxRateCard({ tax, isEditing, onEdit, onSave, onCancel, onDelete, onSetDefault }: TaxRateCardProps) {
  const [editedTax, setEditedTax] = useState(tax);

  React.useEffect(() => {
    setEditedTax(tax);
  }, [tax]);

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editedTax.name}
                onChange={(e) => setEditedTax({ ...editedTax, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-rate">Aliquota (%)</Label>
              <Input
                id="edit-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editedTax.rate}
                onChange={(e) => setEditedTax({ ...editedTax, rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrizione</Label>
              <Input
                id="edit-description"
                value={editedTax.description || ""}
                onChange={(e) => setEditedTax({ ...editedTax, description: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={() => onSave(editedTax)}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel}>
                Annulla
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-semibold text-lg">{tax.name}</h3>
              <p className="text-sm text-muted-foreground">{tax.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{tax.rate}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tax.isDefault && <Badge variant="default">Predefinita</Badge>}
            {!tax.isActive && <Badge variant="secondary">Inattiva</Badge>}
            <div className="flex gap-1">
              {!tax.isDefault && (
                <Button size="sm" variant="outline" onClick={onSetDefault}>
                  Imposta come predefinita
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              {!tax.isDefault && (
                <Button size="sm" variant="ghost" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}