import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Save, Percent, Euro } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Discount {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  validFrom?: string;
  validTo?: string;
}

const defaultDiscounts: Discount[] = [
  { 
    id: "1", 
    name: "Sconto Cliente VIP", 
    type: "percentage", 
    value: 15, 
    isActive: true, 
    description: "Sconto per clienti VIP",
    minAmount: 100
  },
  { 
    id: "2", 
    name: "Sconto Quantità", 
    type: "percentage", 
    value: 10, 
    isActive: true, 
    description: "Sconto per acquisti di grandi quantità",
    minAmount: 500
  },
  { 
    id: "3", 
    name: "Sconto Promozionale", 
    type: "fixed", 
    value: 50, 
    isActive: true, 
    description: "Sconto fisso promozionale",
    validFrom: "2024-01-01",
    validTo: "2024-12-31"
  },
];

export function DiscountManager() {
  const [discounts, setDiscounts] = useState<Discount[]>(defaultDiscounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({
    name: "",
    type: "percentage",
    value: 0,
    isActive: true,
  });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleSave = (discount: Discount) => {
    setDiscounts(discounts => 
      discounts.map(d => d.id === discount.id ? discount : d)
    );
    setEditingId(null);
    toast({
      title: "Successo",
      description: "Sconto aggiornato con successo",
    });
  };

  const handleDelete = (id: string) => {
    setDiscounts(discounts => discounts.filter(d => d.id !== id));
    toast({
      title: "Successo",
      description: "Sconto eliminato con successo",
    });
  };

  const handleAddNew = () => {
    if (!newDiscount.name || !newDiscount.value || newDiscount.value <= 0) {
      toast({
        title: "Errore",
        description: "Inserisci tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }

    const discount: Discount = {
      id: Date.now().toString(),
      name: newDiscount.name!,
      type: newDiscount.type as "percentage" | "fixed",
      value: newDiscount.value!,
      isActive: newDiscount.isActive ?? true,
      description: newDiscount.description,
      minAmount: newDiscount.minAmount,
      maxAmount: newDiscount.maxAmount,
      validFrom: newDiscount.validFrom,
      validTo: newDiscount.validTo,
    };

    setDiscounts(discounts => [...discounts, discount]);
    setNewDiscount({
      name: "",
      type: "percentage",
      value: 0,
      isActive: true,
    });
    setIsAdding(false);
    toast({
      title: "Successo",
      description: "Nuovo sconto aggiunto con successo",
    });
  };

  const toggleActive = (id: string) => {
    setDiscounts(discounts => 
      discounts.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-on-surface">Gestione Sconti</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Sconto
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Nuovo Sconto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-name">Nome *</Label>
                <Input
                  id="new-name"
                  value={newDiscount.name || ""}
                  onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                  placeholder="Nome dello sconto"
                />
              </div>
              <div>
                <Label htmlFor="new-type">Tipo *</Label>
                <Select 
                  value={newDiscount.type} 
                  onValueChange={(value: "percentage" | "fixed") => 
                    setNewDiscount({ ...newDiscount, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentuale</SelectItem>
                    <SelectItem value="fixed">Importo Fisso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-value">
                  Valore * {newDiscount.type === "percentage" ? "(%)" : "(€)"}
                </Label>
                <Input
                  id="new-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDiscount.value || ""}
                  onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="new-min-amount">Importo Minimo (€)</Label>
                <Input
                  id="new-min-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDiscount.minAmount || ""}
                  onChange={(e) => setNewDiscount({ ...newDiscount, minAmount: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label htmlFor="new-valid-from">Valido Dal</Label>
                <Input
                  id="new-valid-from"
                  type="date"
                  value={newDiscount.validFrom || ""}
                  onChange={(e) => setNewDiscount({ ...newDiscount, validFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new-valid-to">Valido Fino</Label>
                <Input
                  id="new-valid-to"
                  type="date"
                  value={newDiscount.validTo || ""}
                  onChange={(e) => setNewDiscount({ ...newDiscount, validTo: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="new-description">Descrizione</Label>
              <Textarea
                id="new-description"
                value={newDiscount.description || ""}
                onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                placeholder="Descrizione dello sconto"
              />
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
        {discounts.map((discount) => (
          <DiscountCard 
            key={discount.id}
            discount={discount}
            isEditing={editingId === discount.id}
            onEdit={() => setEditingId(discount.id)}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
            onDelete={() => handleDelete(discount.id)}
            onToggleActive={() => toggleActive(discount.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface DiscountCardProps {
  discount: Discount;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (discount: Discount) => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function DiscountCard({ discount, isEditing, onEdit, onSave, onCancel, onDelete, onToggleActive }: DiscountCardProps) {
  const [editedDiscount, setEditedDiscount] = useState(discount);

  React.useEffect(() => {
    setEditedDiscount(discount);
  }, [discount]);

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editedDiscount.name}
                onChange={(e) => setEditedDiscount({ ...editedDiscount, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Tipo</Label>
              <Select 
                value={editedDiscount.type} 
                onValueChange={(value: "percentage" | "fixed") => 
                  setEditedDiscount({ ...editedDiscount, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentuale</SelectItem>
                  <SelectItem value="fixed">Importo Fisso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-value">
                Valore {editedDiscount.type === "percentage" ? "(%)" : "(€)"}
              </Label>
              <Input
                id="edit-value"
                type="number"
                min="0"
                step="0.01"
                value={editedDiscount.value}
                onChange={(e) => setEditedDiscount({ ...editedDiscount, value: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="edit-min-amount">Importo Minimo (€)</Label>
              <Input
                id="edit-min-amount"
                type="number"
                min="0"
                step="0.01"
                value={editedDiscount.minAmount || ""}
                onChange={(e) => setEditedDiscount({ ...editedDiscount, minAmount: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div>
              <Label htmlFor="edit-valid-from">Valido Dal</Label>
              <Input
                id="edit-valid-from"
                type="date"
                value={editedDiscount.validFrom || ""}
                onChange={(e) => setEditedDiscount({ ...editedDiscount, validFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-valid-to">Valido Fino</Label>
              <Input
                id="edit-valid-to"
                type="date"
                value={editedDiscount.validTo || ""}
                onChange={(e) => setEditedDiscount({ ...editedDiscount, validTo: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-description">Descrizione</Label>
            <Textarea
              id="edit-description"
              value={editedDiscount.description || ""}
              onChange={(e) => setEditedDiscount({ ...editedDiscount, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onSave(editedDiscount)}>
              <Save className="h-4 w-4 mr-2" />
              Salva
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Annulla
            </Button>
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
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {discount.name}
                {discount.type === "percentage" ? (
                  <Percent className="h-4 w-4 text-primary" />
                ) : (
                  <Euro className="h-4 w-4 text-primary" />
                )}
              </h3>
              <p className="text-sm text-muted-foreground">{discount.description}</p>
              <div className="flex gap-2 mt-2">
                {discount.minAmount && (
                  <Badge variant="outline">Min: €{discount.minAmount}</Badge>
                )}
                {discount.validFrom && discount.validTo && (
                  <Badge variant="outline">
                    {new Date(discount.validFrom).toLocaleDateString()} - {new Date(discount.validTo).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {discount.type === "percentage" ? `${discount.value}%` : `€${discount.value}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch 
                checked={discount.isActive} 
                onCheckedChange={onToggleActive}
              />
              <span className="text-sm">{discount.isActive ? "Attivo" : "Inattivo"}</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}