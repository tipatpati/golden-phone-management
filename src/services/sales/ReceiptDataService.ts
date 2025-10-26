import { format } from 'date-fns';
import { ReceiptValidationService } from './ReceiptValidationService';
import type { Sale } from './types';

export interface ReceiptData {
  companyInfo: {
    name: string;
    address: string[];
    phone: string;
    vatNumber: string;
  };
  documentType: string;
  saleInfo: {
    saleNumber: string;
    saleDate: string;
    clientName?: string;
  };
  items: Array<{
    productName: string;
    serialNumber?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totals: {
    subtotalWithoutVAT: number;
    discountAmount: number;
    finalSubtotal: number;
    vatAmount: number;
    finalTotal: number;
    vatIncluded: boolean; // Add VAT mode flag
  };
  payments: Array<{
    label: string;
    amount: number;
  }>;
  legalTerms: {
    termsText: string;
    fiscalDisclaimer: string;
  };
}

export class ReceiptDataService {
  private static readonly COMPANY_INFO = {
    name: 'GOLDEN TRADE O&A SRL',
    address: [
      'Corso Buenos Aires, 90,',
      '20124 Milano MI'
    ],
    phone: '351 565 6095',
    vatNumber: '13353700969'
  };

  private static readonly LEGAL_TERMS = {
    termsText: `CONDIZIONI DI GARANZIA :
1. La garanzia copre solo difetti di fabbrica.
2. Non copre danni causati da cadute, urti, liquidi o uso improprio.
3. I telefoni caduti in acqua o manomessi non sono coperti da garanzia.
4. In caso di malfunzionamento, il telefono verrà riparato o sostituito con un modello equivalente.
5. In caso di malfunzionamento Il cliente deve lasciare il dispositivo fino a 3 giorni lavorativi per il test tecnico.
6. Non si accettano resi o rimborsi per qualsiasi motivo. In caso di difetto coperto da garanzia, il prodotto verrà riparato o sostituito.

Firma : ———————`,
    fiscalDisclaimer: 'Questo documento non è un documento fiscale.'
  };

  static generateReceiptData(sale: Sale, clientName?: string): ReceiptData {
    // Validate receipt calculations
    const receiptReport = ReceiptValidationService.generateReceiptReport(sale);
    const { calculations } = receiptReport;
    
    // Debug: Log VAT information
    console.log('🧾 ReceiptDataService.generateReceiptData - VAT Info:', {
      saleId: sale.id,
      saleNumber: sale.sale_number,
      vatIncluded: sale.vat_included,
      vatAmount: calculations.vatAmount,
      finalTotal: calculations.finalTotal
    });
    
    // Log validation results for debugging
    if (!receiptReport.overallValid) {
      console.warn('Receipt validation failed:', receiptReport);
    }

    // Process items
    const items = (sale.sale_items || []).map((item, index) => {
      const productName = item.product?.brand && item.product?.model 
        ? `${item.product.brand} ${item.product.model}`
        : `Prodotto ${index + 1}`;

      return {
        productName,
        serialNumber: item.serial_number || undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.quantity * item.unit_price
      };
    });

    // Process payments - unified logic
    const payments = this.getPaymentBreakdown(sale);

    return {
      companyInfo: this.COMPANY_INFO,
      documentType: 'DOCUMENTO DI GARANZIA',
      saleInfo: {
        saleNumber: sale.sale_number,
        saleDate: format(new Date(sale.sale_date), "yyyy-MM-dd HH:mm:ss"),
        clientName
      },
      items,
      totals: {
        subtotalWithoutVAT: calculations.subtotalWithoutVAT,
        discountAmount: calculations.discountAmount,
        finalSubtotal: calculations.finalSubtotal,
        vatAmount: calculations.vatAmount,
        finalTotal: calculations.finalTotal,
        vatIncluded: sale.vat_included || false // Include VAT mode in receipt data
      },
      payments,
      legalTerms: this.LEGAL_TERMS
    };
  }

  static formatLegalTermsForPDF(): string[] {
    return [
      'TUTTE LE VENDITE SONO',
      'DEFINITIVE E NON RIMBORSABILI,',
      'A MENO CHE IL',
      'PRODOTTO NON SIA DIFETTOSO O',
      'DANNEGGIATO.',
      'IL NEGOZIO NON SI',
      'ASSUME RESPONSABILITÀ PER',
      'EVENTUALI DANNI DERIVANTI',
      'DALL\'USO IMPROPRIO DEI',
      'PRODOTTI ACQUISTATI.',
      'IL NEGOZIO SI RISERVA',
      'IL DIRITTO DI RIFIUTARE',
      'LA RESTITUZIONE DI',
      'ARTICOLI DANNEGGIATI O',
      'UTILIZZATI IN MODO NON',
      'APPROPRIATO.'
    ];
  }

  private static getPaymentBreakdown(sale: Sale) {
    const cash = Number(sale.cash_amount) || 0;
    const card = Number(sale.card_amount) || 0;
    const bank = Number(sale.bank_transfer_amount) || 0;

    type PaymentLine = { label: string; amount: number };
    const payments: PaymentLine[] = [];

    if ((sale.payment_type === 'single' || !sale.payment_type) && cash === 0 && card === 0 && bank === 0) {
      // Fallback to single payment_method when split amounts are not provided
      switch (String(sale.payment_method)) {
        case 'cash':
          payments.push({ label: 'Pagato in Contanti:', amount: Number(sale.total_amount) || 0 });
          break;
        case 'card':
          payments.push({ label: 'Pagato con Carta:', amount: Number(sale.total_amount) || 0 });
          break;
        case 'bank_transfer':
          payments.push({ label: 'Pagato con Bonifico:', amount: Number(sale.total_amount) || 0 });
          break;
        default:
          // Unknown method: skip explicit line
          break;
      }
    } else {
      if (cash > 0) payments.push({ label: 'Pagato in Contanti:', amount: cash });
      if (card > 0) payments.push({ label: 'Pagato con Carta:', amount: card });
      if (bank > 0) payments.push({ label: 'Pagato con Bonifico:', amount: bank });
    }

    return payments;
  }

  static formatAmount(amount: number): string {
    return `${amount.toFixed(2)} €`;
  }
}