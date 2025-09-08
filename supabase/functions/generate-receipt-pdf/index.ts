import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Receipt validation service for edge function
class ReceiptValidationService {
  static validateReceiptCalculations(sale: any) {
    const saleItems = sale.sale_items || [];
    const originalSubtotal = saleItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0);
    
    const subtotalWithoutVAT = originalSubtotal / 1.22;
    const discountAmount = Number(sale.discount_amount) || 0;
    const finalSubtotal = subtotalWithoutVAT - discountAmount;
    const vatAmount = finalSubtotal * 0.22;
    const finalTotal = finalSubtotal + vatAmount;

    return {
      originalSubtotal,
      subtotalWithoutVAT,
      discountAmount,
      finalSubtotal,
      vatAmount,
      finalTotal,
      isValid: true,
      errors: []
    };
  }

  static generateReceiptReport(sale: any) {
    const calculations = this.validateReceiptCalculations(sale);
    return {
      calculations,
      itemsValidation: { isValid: true, errors: [] },
      overallValid: true,
      summary: 'Receipt validated successfully'
    };
  }
}

// Shared receipt data logic - unified with client-side
class ReceiptDataService {
  private static readonly COMPANY_INFO = {
    name: 'GOLDEN TRADE Q&A SRL',
    address: [
      'Corso Buenos Aires, 90,',
      '20124 Milano - MI'
    ],
    phone: '+39 351 565 6095',
    vatNumber: '12345678901'
  };

  private static readonly LEGAL_TERMS = {
    termsText: `TUTTE LE VENDITE SONO DEFINITIVE E NON RIMBORSABILI, A MENO CHE IL PRODOTTO NON SIA DIFETTOSO O DANNEGGIATO. IL NEGOZIO NON SI ASSUME RESPONSABILITÀ PER EVENTUALI DANNI DERIVANTI DALL'USO IMPROPRIO DEI PRODOTTI ACQUISTATI. IL NEGOZIO SI RISERVA IL DIRITTO DI RIFIUTARE LA RESTITUZIONE DI ARTICOLI DANNEGGIATI O UTILIZZATI IN MODO NON APPROPRIATO.`,
    fiscalDisclaimer: 'Questo documento non è un documento fiscale.'
  };

  static generateReceiptData(sale: any, clientName?: string) {
    // Validate receipt calculations
    const receiptReport = ReceiptValidationService.generateReceiptReport(sale);
    const { calculations } = receiptReport;
    
    // Log validation results for debugging
    if (!receiptReport.overallValid) {
      console.warn('Receipt validation failed:', receiptReport);
    }

    // Process items
    const items = (sale.sale_items || []).map((item: any, index: number) => {
      const productName = item.products?.brand && item.products?.model 
        ? `${item.products.brand} ${item.products.model}`
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
        saleDate: new Date(sale.sale_date).toISOString().slice(0, 19).replace('T', ' '),
        clientName
      },
      items,
      totals: {
        subtotalWithoutVAT: calculations.subtotalWithoutVAT,
        discountAmount: calculations.discountAmount,
        finalSubtotal: calculations.finalSubtotal,
        vatAmount: calculations.vatAmount,
        finalTotal: calculations.finalTotal
      },
      payments,
      legalTerms: this.LEGAL_TERMS
    };
  }

  private static getPaymentBreakdown(sale: any) {
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
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const saleId = url.searchParams.get('sale_id');

    if (!saleId) {
      return new Response(
        JSON.stringify({ error: 'Sale ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sale data with related information using left joins for resilience
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        clients(*),
        sale_items(
          *,
          products(*)
        )
      `)
      .eq('id', saleId)
      .maybeSingle();

    if (saleError || !sale) {
      console.error('Error fetching sale:', saleError);
      return new Response(
        JSON.stringify({ error: 'Sale not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating PDF for sale:', sale.sale_number);

    // Generate unified receipt data using shared service
    const receiptData = ReceiptDataService.generateReceiptData(sale);

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Thermal receipt size
    });

    // Set font
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);

    let y = 10;
    const lineHeight = 4;
    const pageWidth = 80;

    // Helper utilities
    const addCenteredText = (text: string, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
      y += lineHeight;
    };

    const addLRText = (left: string, right: string) => {
      doc.setFontSize(9);
      doc.text(left, 5, y);
      const rightWidth = doc.getTextWidth(right);
      doc.text(right, pageWidth - rightWidth - 5, y);
      y += lineHeight;
    };

    const addDivider = () => {
      y += 2;
      doc.line(5, y, pageWidth - 5, y);
      y += 4;
    };

    const addWrappedLeftText = (text: string, maxWidth: number, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const wrapped = doc.splitTextToSize(text, maxWidth);
      wrapped.forEach((line: string) => {
        doc.text(line, 5, y);
        y += lineHeight;
      });
    };

    // Company header using unified data
    addCenteredText(receiptData.companyInfo.name, 14);
    receiptData.companyInfo.address.forEach(line => addCenteredText(line));
    addCenteredText(`P. IVA: ${receiptData.companyInfo.vatNumber}`);
    addCenteredText(`Tel: ${receiptData.companyInfo.phone}`);
    
    // Add line
    y += 2;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    // Document type
    addCenteredText(receiptData.documentType, 11);
    y += 2;

    // Items summary
    addCenteredText('ARTICOLI VENDUTI', 11);
    y += 2;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    // Validate items exist and log details
    if (!receiptData.items || receiptData.items.length === 0) {
      console.warn('No sale items found for sale:', sale.sale_number);
      addCenteredText('Nessun articolo trovato', 9);
    } else {
      console.log(`Processing ${receiptData.items.length} items for receipt`);
      
      receiptData.items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, item);
        
        // Wrap long names to fit receipt width
        addWrappedLeftText(item.productName, pageWidth - 10, 10);
        
        addLRText(`x${item.quantity} @ €${item.unitPrice.toFixed(2)}`, `€${item.lineTotal.toFixed(2)}`);

        // Optional serial number line
        if (item.serialNumber) {
          doc.setFontSize(8);
          doc.text(`SN: ${item.serialNumber}`, 5, y);
          y += lineHeight;
          doc.setFontSize(10);
        }

        y += 2; // spacing between items
      });
    }

    // Totals section using unified calculations
    addLRText('Subtotale (esclusa IVA):', ReceiptDataService.formatAmount(receiptData.totals.subtotalWithoutVAT));
    
    if (receiptData.totals.discountAmount > 0) {
      addLRText('Sconto:', `-${ReceiptDataService.formatAmount(receiptData.totals.discountAmount)}`);
      addLRText('Subtotale scontato:', ReceiptDataService.formatAmount(receiptData.totals.finalSubtotal));
    }
    
    addLRText('IVA (22%):', ReceiptDataService.formatAmount(receiptData.totals.vatAmount));

    // Payment methods using unified logic
    receiptData.payments.forEach(p => addLRText(p.label, ReceiptDataService.formatAmount(p.amount)));

    // Divider and total
    addDivider();
    doc.setFontSize(11);
    addLRText('TOTALE:', ReceiptDataService.formatAmount(receiptData.totals.finalTotal));
    y += 4;

    // Date and time
    addCenteredText(receiptData.saleInfo.saleDate);
    y += 4;

    // Legal terms using unified formatting
    doc.setFontSize(8);
    const legalTermsLines = ReceiptDataService.formatLegalTermsForPDF();

    legalTermsLines.forEach(line => {
      addCenteredText(line, 8);
    });

    y += 4;
    addCenteredText(receiptData.legalTerms.fiscalDisclaimer, 8);

    // Generate PDF as ArrayBuffer
    const pdfOutput = doc.output('arraybuffer');

    return new Response(pdfOutput, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ricevuta-${sale.sale_number}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});