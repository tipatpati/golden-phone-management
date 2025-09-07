import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch sale data with related information
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        clients!inner(*),
        sale_items!inner(
          *,
          products!inner(*)
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

    // Helper function to add centered text
    const addCenteredText = (text: string, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
      y += lineHeight;
    };

    // Helper function to add left-right aligned text
    const addLRText = (left: string, right: string) => {
      doc.setFontSize(9);
      doc.text(left, 5, y);
      const rightWidth = doc.getTextWidth(right);
      doc.text(right, pageWidth - rightWidth - 5, y);
      y += lineHeight;
    };

    // Company header
    addCenteredText('GOLDEN TRADE Q&A SRL', 14);
    addCenteredText('Corso Buenos Aires, 90,');
    addCenteredText('20124 Milano - MI');
    addCenteredText('P. IVA: 12345678901');
    addCenteredText('Tel: +39 351 565 6095');
    
    // Add line
    y += 2;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    // Document type
    addCenteredText('DOCUMENTO DI GARANZIA', 11);
    y += 2;

    // Items summary
    addCenteredText('Articoli', 11);
    y += 2;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    if (sale.sale_items && sale.sale_items.length > 0) {
      sale.sale_items.forEach((item: any) => {
        // Build product name (Brand + Model)
        const nameParts: string[] = [];
        if (item.products?.brand) nameParts.push(item.products.brand);
        if (item.products?.model) nameParts.push(item.products.model);
        const productName = (nameParts.join(' ') || 'Articolo');

        // Wrap long names to fit receipt width
        const wrapped = doc.splitTextToSize(productName, pageWidth - 10);
        doc.setFontSize(10);
        wrapped.forEach((line: string) => {
          doc.text(line, 5, y);
          y += lineHeight;
        });

        // Quantity, unit price and line total
        const qty = Number(item.quantity) || 1;
        const unit = Number(item.unit_price) || 0;
        const lineTotal = Number(item.total_price) || (qty * unit);
        addLRText(`x${qty} @ €${unit.toFixed(2)}`, `€${lineTotal.toFixed(2)}`);

        // Optional serial number line
        if (item.serial_number) {
          doc.setFontSize(8);
          doc.text(`SN: ${item.serial_number}`, 5, y);
          y += lineHeight;
          doc.setFontSize(10);
        }

        y += 2; // spacing between items
      });
    } else {
      addCenteredText('Nessun articolo', 9);
    }

    y += 4;

    // Payment details
    const cardAmount = sale.payment_method === 'card' ? sale.total_amount : 0;
    const cashAmount = sale.payment_method === 'cash' ? sale.total_amount : 0;

    addLRText('Pagato con Carta:', `${cardAmount.toFixed(2)} €`);
    addLRText('Pagato in Contanti:', `${cashAmount.toFixed(2)} €`);
    addLRText('Sconto:', `${(sale.discount_amount || 0).toFixed(2)} €`);
    
    // Add line for total
    y += 2;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;
    
    doc.setFontSize(11);
    addLRText('Totale:', `${sale.total_amount.toFixed(2)} €`);
    y += 4;

    // Date and time
    const saleDate = new Date(sale.sale_date);
    addCenteredText(saleDate.toISOString().slice(0, 19).replace('T', ' '));
    y += 4;

    // Legal terms
    doc.setFontSize(8);
    const legalText = [
      'TUTTE LE VENDITE SONO',
      'DEFINITIVE E NON RIMBORSABILI,',
      'A MENO CHE IL',
      'PRODOTTO NON SIA DANNEGGIATO.',
      'IL NEGOZIO NON',
      'SI ASSUME RESPONSABILITÀ PER',
      'EVENTUALI DANNI DERIVANTI DA',
      'USO IMPROPRIO DEI PRODOTTI',
      'ACQUISTATI. IL NEGOZIO HA',
      'IL DIRITTO DI RIFIUTARE',
      'QUALSIASI DANNEGGIAMENTO ARTICOLI',
      'DANNEGGIATO E UTILIZZATI IN',
      'MODO NON APPROPRIATO.'
    ];

    legalText.forEach(line => {
      addCenteredText(line, 8);
    });

    y += 4;
    addCenteredText('Questo documento non è', 8);
    addCenteredText('un documento fiscale.', 8);

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