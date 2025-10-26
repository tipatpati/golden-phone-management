import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { Sale } from '@/services/sales/types';
import type { ReturnReason, RefundMethod, ReturnCondition, SaleReturn } from '@/services/sales/returns/types';
import { useCreateReturn } from '@/services/sales/returns/ReturnReactQueryService';
import { ReturnCalculationService } from '@/services/sales/returns/ReturnCalculationService';
import { Euro, Package } from 'lucide-react';
import { ReturnReceiptDialog } from './returns/ReturnReceiptDialog';

interface ProcessReturnDialogProps {
  sale: Sale;
  open: boolean;
  onClose: () => void;
}

export const ProcessReturnDialog: React.FC<ProcessReturnDialogProps> = ({
  sale,
  open,
  onClose,
}) => {
  const [returnReason, setReturnReason] = React.useState<ReturnReason>('customer_request');
  const [refundMethod, setRefundMethod] = React.useState<RefundMethod>('cash');
  const [notes, setNotes] = React.useState('');
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [itemConditions, setItemConditions] = React.useState<Record<string, ReturnCondition>>({});
  const [createdReturn, setCreatedReturn] = React.useState<SaleReturn | null>(null);
  const [showReceipt, setShowReceipt] = React.useState(false);
  
  const createReturn = useCreateReturn();
  
  const saleItems = sale.sale_items || [];
  
  // Calculate refund
  const calculation = React.useMemo(() => {
    const itemsToReturn = saleItems
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        sale_item_id: item.id,
        unit_price: item.unit_price,
        quantity: item.quantity,
        return_condition: itemConditions[item.id] || 'good'
      }));
    
    if (itemsToReturn.length === 0) {
      return { originalAmount: 0, restockingFee: 0, refundAmount: 0, breakdown: [] };
    }
    
    return ReturnCalculationService.calculateReturn(sale.sale_date, itemsToReturn);
  }, [selectedItems, itemConditions, saleItems, sale.sale_date]);
  
  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      const newConditions = { ...itemConditions };
      delete newConditions[itemId];
      setItemConditions(newConditions);
    } else {
      newSelected.add(itemId);
      setItemConditions({ ...itemConditions, [itemId]: 'good' });
    }
    setSelectedItems(newSelected);
  };
  
  const handleConditionChange = (itemId: string, condition: ReturnCondition) => {
    setItemConditions({ ...itemConditions, [itemId]: condition });
  };
  
  const handleSubmit = () => {
    const returnItems = saleItems
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        sale_item_id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        serial_number: item.serial_number,
        return_condition: itemConditions[item.id] || 'good'
      }));
    
    createReturn.mutate(
      {
        sale_id: sale.id,
        return_reason: returnReason,
        refund_method: refundMethod,
        notes,
        items: returnItems
      },
      {
        onSuccess: (data) => {
          onClose();
          setCreatedReturn(data);
          setShowReceipt(true);
          setSelectedItems(new Set());
          setItemConditions({});
          setNotes('');
        }
      }
    );
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Elabora Reso</DialogTitle>
            <DialogDescription>
              Vendita #{sale.sale_number} - {new Date(sale.sale_date).toLocaleDateString('it-IT')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Items Selection */}
            <div className="space-y-3">
              <Label>Seleziona articoli da restituire</Label>
              <div className="border rounded-lg divide-y">
                {saleItems.map(item => {
                  const product = item.product;
                  const isSelected = selectedItems.has(item.id);
                  
                  return (
                    <div key={item.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {product?.brand} {product?.model}
                            </span>
                          </div>
                          {item.serial_number && (
                            <p className="text-sm text-muted-foreground">S/N: {item.serial_number}</p>
                          )}
                          <p className="text-sm">
                            Quantità: {item.quantity} × €{item.unit_price.toFixed(2)} = €{item.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="ml-8">
                          <Label className="text-sm">Condizione di reso</Label>
                          <Select
                            value={itemConditions[item.id] || 'good'}
                            onValueChange={(value) => handleConditionChange(item.id, value as ReturnCondition)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">Nuovo (imballaggio originale)</SelectItem>
                              <SelectItem value="good">Buono (usato ma funzionante)</SelectItem>
                              <SelectItem value="damaged">Danneggiato</SelectItem>
                              <SelectItem value="defective">Difettoso (garanzia)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Refund Calculation */}
            {selectedItems.size > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Euro className="h-4 w-4" />
                  <span>Calcolo rimborso</span>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Importo originale:</span>
                    <span>€{calculation.originalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Costo riassortimento:</span>
                    <span>-€{calculation.restockingFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Importo rimborso:</span>
                    <span>€{calculation.refundAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Return Reason */}
            <div className="space-y-2">
              <Label>Motivo del reso</Label>
              <Select value={returnReason} onValueChange={(value) => setReturnReason(value as ReturnReason)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_request">Richiesta del cliente</SelectItem>
                  <SelectItem value="defective">Difettoso</SelectItem>
                  <SelectItem value="wrong_item">Articolo sbagliato</SelectItem>
                  <SelectItem value="damaged_on_arrival">Danneggiato all'arrivo</SelectItem>
                  <SelectItem value="changed_mind">Ripensamento</SelectItem>
                  <SelectItem value="warranty_claim">Garanzia</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Refund Method */}
            <div className="space-y-2">
              <Label>Metodo di rimborso</Label>
              <Select value={refundMethod} onValueChange={(value) => setRefundMethod(value as RefundMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Contanti</SelectItem>
                  <SelectItem value="card">Carta</SelectItem>
                  <SelectItem value="bank_transfer">Bonifico bancario</SelectItem>
                  <SelectItem value="store_credit">Credito negozio</SelectItem>
                  <SelectItem value="exchange">Cambio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive sul reso..."
                rows={3}
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedItems.size === 0 || createReturn.isPending}
              >
                {createReturn.isPending ? 'Elaborazione...' : 'Conferma Reso'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Receipt Dialog */}
      {createdReturn && (
        <ReturnReceiptDialog
          returnRecord={createdReturn}
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setCreatedReturn(null);
          }}
        />
      )}
    </>
  );
};
