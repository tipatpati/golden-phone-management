import React from 'react';
import { type Sale } from '@/services';
import { format } from 'date-fns';
import { ReceiptValidationService } from '@/services/sales/ReceiptValidationService';

interface ReceiptContentProps {
  sale: Sale;
  qrCode?: string;
  clientName: string;
}

export function ReceiptContent({ sale, qrCode, clientName }: ReceiptContentProps) {
  // Validate receipt calculations
  const receiptReport = ReceiptValidationService.generateReceiptReport(sale);
  const { calculations } = receiptReport;
  
  // Log validation results for debugging
  if (!receiptReport.overallValid) {
    console.warn('Receipt validation failed:', receiptReport);
  }

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

      {/* All Product Items */}
      <div style={{
        marginBottom: '8px',
        fontSize: '10px'
      }}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '11px',
          marginBottom: '4px',
          borderBottom: '1px solid #000',
          paddingBottom: '2px'
        }}>ARTICOLI VENDUTI:</div>
        
        {sale.sale_items?.map((item, index) => (
          <div key={index} style={{
            marginBottom: '6px',
            paddingBottom: '4px',
            borderBottom: index < (sale.sale_items?.length || 0) - 1 ? '1px dashed #ccc' : 'none'
          }}>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '1px',
              fontSize: '12px'
            }}>
              {item.product?.brand || "Prodotto"} {item.product?.model || ""}
            </div>
            {item.serial_number && (
              <div style={{
                marginBottom: '1px',
                fontSize: '9px'
              }}>
                SN: {item.serial_number}
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px'
            }}>
              <span>Qta: {item.quantity}</span>
              <span>€{item.unit_price.toFixed(2)} x {item.quantity}</span>
              <span style={{ fontWeight: 'bold' }}>€{(item.quantity * item.unit_price).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section - Using Validated Calculations */}
      <div style={{
        marginBottom: '8px',
        fontSize: '10px',
        borderTop: '1px solid #000',
        paddingTop: '4px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2px'
        }}>
          <span>Subtotale (esclusa IVA):</span>
          <span>{formatAmount(calculations.subtotalWithoutVAT)}</span>
        </div>
        {calculations.discountAmount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px',
            color: '#666'
          }}>
            <span>Sconto:</span>
            <span>-{formatAmount(calculations.discountAmount)}</span>
          </div>
        )}
        {calculations.discountAmount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px'
          }}>
            <span>Subtotale scontato:</span>
            <span>{formatAmount(calculations.finalSubtotal)}</span>
          </div>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2px'
        }}>
          <span>IVA (22%):</span>
          <span>{formatAmount(calculations.vatAmount)}</span>
        </div>
        
        {/* Payment Methods */}
        {payments.map((payment, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px',
            fontStyle: 'italic'
          }}>
            <span>{payment.label}</span>
            <span>{formatAmount(payment.amount)}</span>
          </div>
        ))}
        
        <div style={{
          borderTop: '2px solid #000',
          paddingTop: '4px',
          marginTop: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            <span>TOTALE:</span>
            <span>{formatAmount(calculations.finalTotal)}</span>
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
        textAlign: 'center',
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: 'bold'
      }}>
        <p>TUTTE LE VENDITE SONO
        DEFINITIVE E NON
        RIMBORSABILI, A MENO
        CHE IL PRODOTTO NON SIA
        DIFETTOSO O
        DANNEGGIATO.
        IL NEGOZIO NON SI
        ASSUME RESPONSABILITÀ
        PER EVENTUALI DANNI
        DERIVANTI DALL'USO
        IMPROPRIO DEI PRODOTTI
        ACQUISTATI.
        IL NEGOZIO SI RISERVA
        IL DIRITTO DI RIFIUTARE
        LA RESTITUZIONE DI
        ARTICOLI DANNEGGIATI O
        UTILIZZATI IN MODO NON
        APPROPRIATO.
        Questo documento non è
        un documento fiscale.</p>
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