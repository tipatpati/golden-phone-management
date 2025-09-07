import { z } from 'zod';
import { validateInput } from '@/utils/securityEnhancements';

// Validation schemas
export const saleItemSchema = z.object({
  product_id: z.string().uuid('ID prodotto non valido'),
  quantity: z.number().min(1, 'La quantità deve essere almeno 1').max(1000, 'Quantità troppo alta'),
  unit_price: z.number().min(0.01, 'Il prezzo deve essere positivo').max(99999.99, 'Prezzo troppo alto'),
  serial_number: z.string().optional(),
});

export const createSaleSchema = z.object({
  client_id: z.string().uuid('ID cliente non valido').optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'hybrid', 'other'], {
    errorMap: () => ({ message: 'Metodo di pagamento non valido' })
  }),
  payment_type: z.enum(['single', 'hybrid']).optional(),
  cash_amount: z.number().min(0, 'Importo contanti non valido').optional(),
  card_amount: z.number().min(0, 'Importo carta non valido').optional(),
  bank_transfer_amount: z.number().min(0, 'Importo bonifico non valido').optional(),
  discount_amount: z.number().min(0, 'Sconto non valido').max(99999.99, 'Sconto troppo alto').optional(),
  discount_percentage: z.number().min(0, 'Percentuale sconto non valida').max(100, 'Percentuale sconto troppo alta').optional(),
  notes: z.string().max(1000, 'Le note non possono superare i 1000 caratteri').optional(),
  sale_items: z.array(saleItemSchema).min(1, 'Devi aggiungere almeno un prodotto'),
});

export class SalesValidationService {
  // Client-side validation with security checks
  static async validateSaleData(data: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Schema validation
      createSaleSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => e.message));
      }
    }

    // Security validation for text fields
    if (data.notes) {
      const notesValidation = await validateInput.serverValidate(data.notes, 'text', 1000);
      if (!notesValidation.valid) {
        errors.push('Le note contengono caratteri non validi');
      }
    }

    // Business rule validations
    if (data.payment_method === 'hybrid') {
      const totalPaid = (data.cash_amount || 0) + (data.card_amount || 0) + (data.bank_transfer_amount || 0);
      const calculatedTotal = this.calculateTotal(data.sale_items, data.discount_amount);
      
      if (Math.abs(totalPaid - calculatedTotal) > 0.01) {
        errors.push('Il totale dei pagamenti ibridi non corrisponde al totale della garentille');
      }
    }

    // Validate item prices are within allowed ranges
    for (const item of data.sale_items) {
      if (item.min_price && item.max_price) {
        if (item.unit_price < item.min_price || item.unit_price > item.max_price) {
          errors.push(`Il prezzo per ${item.product_name} è fuori dal range consentito (€${item.min_price} - €${item.max_price})`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Calculate total with discount
  private static calculateTotal(items: any[], discountAmount: number = 0): number {
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * 0.22; // 22% IVA
    return afterDiscount + taxAmount;
  }

  // Sanitize input data
  static sanitizeInput(data: any): any {
    return {
      ...data,
      notes: data.notes?.trim().slice(0, 1000) || '',
      sale_items: data.sale_items.map((item: any) => ({
        ...item,
        serial_number: item.serial_number?.trim() || null,
        quantity: Math.max(1, Math.min(1000, Math.floor(item.quantity || 1))),
        unit_price: Math.max(0.01, Math.min(99999.99, item.unit_price || 0)),
      })),
    };
  }

  // Rate limiting check for sale creation
  static isWithinRateLimit(userSalesCount: number, timeWindow: number): boolean {
    // Allow max 10 sales per minute for normal users
    const maxSalesPerMinute = 10;
    return userSalesCount <= maxSalesPerMinute;
  }
}