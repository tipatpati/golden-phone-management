import React from 'react';
import { type Sale } from '@/services';
import { format } from 'date-fns';

interface ReceiptContentProps {
  sale: Sale;
  qrCode?: string;
  clientName: string;
}

export function ReceiptContent({ sale, qrCode, clientName }: ReceiptContentProps) {
  // Unified payment logic - matches edge function exactly
  const getPaymentBreakdown = () => {
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
  };

  const formatAmount = (amount: number) => `${amount.toFixed(2)} €`;
  const payments = getPaymentBreakdown();

  return (
    <>
      {/* Company Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '8px',
        paddingBottom: '4px',
        borderBottom: '1px solid #000'
      }}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '16.8px',
          marginBottom: '2px',
          letterSpacing: '0.5px'
        }}>
          GOLDEN TRADE Q&A SRL
        </div>
        <div style={{
          fontSize: '11px',
          lineHeight: '1.3'
        }}>
          Corso Buenos Aires, 90,<br />
          20124 Milano - MI<br />
          P. IVA: 12345678901<br />
          Tel: +39 351 565 6095
        </div>
      </div>

      {/* Document Type */}
      <div style={{
        textAlign: 'center',
        marginBottom: '8px',
        paddingBottom: '4px'
      }}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '10.4px',
          marginBottom: '2px'
        }}>DOCUMENTO DI GARANZIA</div>
      </div>

      {/* Product Info */}
      <div style={{
        marginBottom: '8px',
        fontSize: '11px'
      }}>
        {sale.sale_items?.slice(0, 1).map((item, index) => (
          <div key={index} style={{
            marginBottom: '4px'
          }}>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '2px',
              fontSize: '13px'
            }}>
              {item.product?.brand || "Smartphone"}
            </div>
            <div style={{
              marginBottom: '1px'
            }}>
              {item.product?.model || "iPhone 13 Pro Max"}
            </div>
            <div style={{
              marginBottom: '1px'
            }}>
              SN: {item.serial_number || "359357621574578"}
            </div>
            <div style={{
              fontSize: '10px'
            }}>
              Garanzia: 1 anno
            </div>
          </div>
        ))}
      </div>

      {/* Payment Details - Unified Logic */}
      <div style={{
        marginBottom: '8px',
        fontSize: '10px'
      }}>
        {payments.map((payment, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px'
          }}>
            <span>{payment.label}</span>
            <span>{formatAmount(payment.amount)}</span>
          </div>
        ))}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2px'
        }}>
          <span>Sconto:</span>
          <span>{formatAmount(Number(sale.discount_amount) || 0)}</span>
        </div>
        <div style={{
          borderTop: '1px solid #000',
          paddingTop: '2px',
          marginTop: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            <span>Totale:</span>
            <span>{formatAmount(Number(sale.total_amount) || 0)}</span>
          </div>
        </div>
      </div>

      {/* QR Code */}
      {qrCode && (
        <div style={{
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          <img src={qrCode} alt="QR Code" style={{
            width: '60px',
            height: '60px',
            margin: '0 auto',
            border: '1px solid #000'
          }} />
        </div>
      )}

      {/* Date and Time */}
      <div style={{
        textAlign: 'center',
        marginBottom: '8px',
        fontSize: '10px'
      }}>
        <div>{format(new Date(sale.sale_date), "yyyy-MM-dd HH:mm:ss")}</div>
      </div>

      {/* Legal Terms */}
      <div style={{
        fontSize: '9px',
        lineHeight: '2.24',
        marginBottom: '8px',
        textAlign: 'justify',
        width: '40%',
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: 'bold'
      }}>
        TUTTE LE VENDITE SONO<br />
        DEFINITIVE E NON RIMBORSABILI,<br />
        A MENO CHE IL<br />
        PRODOTTO NON SIA DANNEGGIATO.<br />
        IL NEGOZIO NON<br />
        SI ASSUME RESPONSABILITÀ PER<br />
        EVENTUALI DANNI DERIVANTI DA<br />
        USO IMPROPRIO DEI PRODOTTI<br />
        ACQUISTATI. IL NEGOZIO HA<br />
        IL DIRITTO DI RIFIUTARE<br />
        QUALSIASI DANNEGGIAMENTO ARTICOLI<br />
        DANNEGGIATO E UTILIZZATI IN<br />
        MODO NON APPROPRIATO.
      </div>

      {/* Final Footer */}
      <div style={{
        textAlign: 'center',
        fontSize: '9px'
      }}>
        Questo documento non è<br />
        un documento fiscale.
      </div>
    </>
  );
}