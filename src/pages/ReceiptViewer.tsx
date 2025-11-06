import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReceiptContent } from '@/components/sales/ReceiptContent';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { type Sale } from '@/services';
import { getCanonicalBaseUrl } from '@/utils/authRedirect';
import QRCode from 'qrcode';

export default function ReceiptViewer() {
  const { saleNumber } = useParams<{ saleNumber: string }>();
  const [sale, setSale] = React.useState<Sale | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [qrCode, setQrCode] = React.useState<string>('');

  React.useEffect(() => {
    async function fetchSale() {
      if (!saleNumber) {
        setError('Numero vendita mancante');
        setLoading(false);
        return;
      }

      try {
        // Fetch sale without authentication (public access)
        const { data, error: fetchError } = await supabase
          .from('sales')
          .select(`
            *,
            client:clients(id, type, first_name, last_name, company_name, email, phone),
            sale_items(
              id,
              product_id,
              product_name,
              serial_number,
              quantity,
              unit_price,
              line_total
            )
          `)
          .eq('sale_number', saleNumber)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Ricevuta non trovata');

        setSale(data as unknown as Sale);

        // Generate QR code
        const qrUrl = `${getCanonicalBaseUrl()}/receipt/${saleNumber}`;
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 120,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        setQrCode(qrDataUrl);
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Impossibile caricare la ricevuta');
      } finally {
        setLoading(false);
      }
    }

    fetchSale();
  }, [saleNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Errore</h1>
          <p className="text-muted-foreground">{error || 'Ricevuta non trovata'}</p>
        </div>
      </div>
    );
  }

  const clientName = sale.client 
    ? sale.client.type === 'individual'
      ? `${sale.client.first_name || ''} ${sale.client.last_name || ''}`.trim()
      : sale.client.company_name || ''
    : '';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Ricevuta Vendita</h1>
          <p className="text-sm text-muted-foreground">
            Ricevuta #{sale.sale_number}
          </p>
        </div>
        
        <div className="border-2 border-border rounded p-4">
          <ReceiptContent 
            sale={sale} 
            qrCode={qrCode}
            clientName={clientName}
          />
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Questa ricevuta è accessibile pubblicamente tramite il QR code</p>
        </div>
      </div>
    </div>
  );
}
