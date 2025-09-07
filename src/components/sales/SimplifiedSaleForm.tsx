import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  X, 
  ShoppingCart, 
  CreditCard, 
  User, 
  FileText,
  Package,
  DollarSign,
  Percent,
  AlertTriangle
} from 'lucide-react';
import { EnhancedProductSearch } from './enhanced/EnhancedProductSearch';
import { ClientSelector } from './ClientSelector';
import { useCreateSale } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StockCalculationService } from '@/services/inventory/StockCalculationService';

interface SaleItem {
  product_id: string;
  product_name: string;
  brand: string;
  model: string;
  year?: number;
  quantity: number;
  unit_price: number;
  min_price?: number;
  max_price?: number;
  serial_number?: string;
  stock?: number;
  product_unit_id?: string;
  barcode?: string;
}

interface SimplifiedSaleFormProps {
  onSaleComplete?: (sale: any) => void;
  onCancel?: () => void;
}

export function SimplifiedSaleForm({ onSaleComplete, onCancel }: SimplifiedSaleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createSale = useCreateSale();

  // Core state
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState('');
  
  // Discount state
  const [discountType, setDiscountType] = useState<'percentage' | 'amount' | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  
  // Hybrid payment amounts
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [bankTransferAmount, setBankTransferAmount] = useState(0);

  // Stock cache for real-time updates
  const [stockCache, setStockCache] = useState<Map<string, number>>(new Map());

  // Calculations
  const subtotal = useMemo(() => 
    items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0), 
    [items]
  );

  const discountAmount = useMemo(() => {
    if (!discountType || discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(discountValue, subtotal);
  }, [discountType, discountValue, subtotal]);

  const finalSubtotal = subtotal - discountAmount;
  const taxAmount = finalSubtotal * 0.22; // 22% IVA
  const totalAmount = finalSubtotal + taxAmount;

  const totalPaid = useMemo(() => {
    if (paymentMethod !== 'hybrid') return totalAmount;
    return cashAmount + cardAmount + bankTransferAmount;
  }, [paymentMethod, cashAmount, cardAmount, bankTransferAmount, totalAmount]);

  // Get stock for a product
  const getStock = useCallback((productId: string): number => {
    return stockCache.get(productId) ?? 0;
  }, [stockCache]);

  // Refresh stock for products
  const refreshStock = useCallback(async (productIds: string[]) => {
    try {
      const stockMap = await StockCalculationService.fetchEffectiveStockBatch(productIds);
      setStockCache(prev => new Map([...prev, ...stockMap]));
    } catch (error) {
      console.error('Failed to refresh stock:', error);
    }
  }, []);

  // Add product to sale
  const handleAddProduct = useCallback(async (product: any) => {
    if (!product?.id) {
      toast({ title: 'Errore', description: 'ID prodotto mancante', variant: 'destructive' });
      return;
    }

    const existingItem = items.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Update quantity
      setItems(prev => prev.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Add new item
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: `${product.brand} ${product.model}`,
        brand: product.brand,
        model: product.model,
        year: product.year,
        quantity: 1,
        unit_price: product.price || product.max_price || 0,
        min_price: product.min_price,
        max_price: product.max_price,
        serial_number: '',
      };
      
      setItems(prev => [...prev, newItem]);
    }

    // Refresh stock
    await refreshStock([product.id]);
    toast({ title: 'Prodotto aggiunto', description: `${product.brand} ${product.model} aggiunto alla vendita` });
  }, [items, refreshStock, toast]);

  // Remove item
  const handleRemoveItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product_id !== productId));
  }, []);

  // Update item quantity
  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    
    setItems(prev => prev.map(item =>
      item.product_id === productId ? { ...item, quantity } : item
    ));
  }, [handleRemoveItem]);

  // Update item price
  const handleUpdatePrice = useCallback((productId: string, price: number) => {
    if (price <= 0) return;
    
    setItems(prev => prev.map(item =>
      item.product_id === productId ? { ...item, unit_price: price } : item
    ));
  }, []);

  // Update serial number
  const handleUpdateSerial = useCallback((productId: string, serialNumber: string) => {
    setItems(prev => prev.map(item =>
      item.product_id === productId ? { ...item, serial_number: serialNumber } : item
    ));
  }, []);

  // Validation
  const isValid = useMemo(() => {
    if (items.length === 0) return false;
    if (!paymentMethod) return false;
    if (paymentMethod === 'hybrid' && Math.abs(totalPaid - totalAmount) > 0.01) return false;
    return true;
  }, [items, paymentMethod, totalPaid, totalAmount]);

  // Submit sale
  const handleSubmit = async () => {
    if (!isValid || !user?.id) return;

    try {
      const saleData = {
        client_id: selectedClient?.id,
        salesperson_id: user.id,
        payment_method: paymentMethod,
        payment_type: paymentMethod === 'hybrid' ? 'hybrid' as const : 'single' as const,
        cash_amount: paymentMethod === 'hybrid' ? cashAmount : (paymentMethod === 'cash' ? totalAmount : 0),
        card_amount: paymentMethod === 'hybrid' ? cardAmount : (paymentMethod === 'card' ? totalAmount : 0),
        bank_transfer_amount: paymentMethod === 'hybrid' ? bankTransferAmount : (paymentMethod === 'bank_transfer' ? totalAmount : 0),
        discount_amount: discountAmount,
        discount_percentage: discountType === 'percentage' ? discountValue : 0,
        notes,
        sale_items: items.map(item => ({
          product_id: item.product_id,
          product_unit_id: item.product_unit_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          serial_number: item.serial_number,
          barcode: item.barcode
        }))
      };

      const result = await createSale.mutateAsync(saleData as any);
      toast({ title: 'Successo', description: 'Vendita creata con successo!' });
      onSaleComplete?.(result);
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({ 
        title: 'Errore', 
        description: 'Errore nella creazione della vendita', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Products */}
      <div className="lg:col-span-2 space-y-6">
        {/* Product Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Aggiungi Prodotti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedProductSearch onProductAdd={handleAddProduct} />
          </CardContent>
        </Card>

        {/* Sale Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Prodotti nella Vendita ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessun prodotto aggiunto</p>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.product_id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{item.product_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {getStock(item.product_id)} disponibili
                        </Badge>
                        {item.quantity > getStock(item.product_id) && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Stock insufficiente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveItem(item.product_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label>Quantità</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          className="h-8 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <Label>Prezzo</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleUpdatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>

                    {/* Serial */}
                    <div className="space-y-2">
                      <Label>Serial</Label>
                      <Input
                        value={item.serial_number || ''}
                        onChange={(e) => handleUpdateSerial(item.product_id, e.target.value)}
                        placeholder="Opzionale"
                        className="h-8"
                      />
                    </div>

                    {/* Total */}
                    <div className="space-y-2">
                      <Label>Totale</Label>
                      <div className="h-8 flex items-center font-bold">
                        €{(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Client, Payment, Totals */}
      <div className="space-y-6">
        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClientSelector
              selectedClient={selectedClient}
              onClientSelect={setSelectedClient}
              onClientClear={() => setSelectedClient(null)}
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Metodo</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona metodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Contanti</SelectItem>
                  <SelectItem value="card">Carta</SelectItem>
                  <SelectItem value="bank_transfer">Bonifico</SelectItem>
                  <SelectItem value="hybrid">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hybrid Payment */}
            {paymentMethod === 'hybrid' && (
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="space-y-2">
                  <Label>Contanti</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carta</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonifico</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bankTransferAmount}
                    onChange={(e) => setBankTransferAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Totale pagato: </span>
                  <span className={Math.abs(totalPaid - totalAmount) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                    €{totalPaid.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground"> / €{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Sconto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={discountType === 'percentage' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountType(discountType === 'percentage' ? null : 'percentage')}
                >
                  %
                </Button>
                <Button
                  variant={discountType === 'amount' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountType(discountType === 'amount' ? null : 'amount')}
                >
                  €
                </Button>
              </div>
              
              {discountType && (
                <Input
                  type="number"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percentage' ? 'Percentuale' : 'Importo'}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note aggiuntive..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Totals & Submit */}
        {items.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" />
                Totale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotale:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Sconto:</span>
                  <span>-€{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA (22%):</span>
                <span>€{taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Totale:</span>
                <span>€{totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || createSale.isPending}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  {createSale.isPending ? 'Creazione...' : `Crea Vendita - €${totalAmount.toFixed(2)}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="w-full"
                >
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}