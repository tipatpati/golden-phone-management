import React from 'react';
import { type Sale } from '@/services';
import { ReceiptDataService } from '@/services/sales/ReceiptDataService';

interface ReceiptContentProps {
  sale: Sale;
  qrCode?: string;
  clientName: string;
}

export function ReceiptContent({ sale, qrCode, clientName }: ReceiptContentProps) {
  // Generate unified receipt data
  const receiptData = ReceiptDataService.generateReceiptData(sale, clientName);

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
          {receiptData.companyInfo.name}
        </div>
        <div style={{
          fontSize: '11px',
          lineHeight: '1.3'
        }}>
          {receiptData.companyInfo.address.map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < receiptData.companyInfo.address.length - 1 && <br />}
            </React.Fragment>
          ))}
          <br />
          P. IVA: {receiptData.companyInfo.vatNumber}<br />
          Tel: {receiptData.companyInfo.phone}
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
        }}>{receiptData.documentType}</div>
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
        
        {receiptData.items.map((item, index) => (
          <div key={index} style={{
            marginBottom: '6px',
            paddingBottom: '4px',
            borderBottom: index < receiptData.items.length - 1 ? '1px dashed #ccc' : 'none'
          }}>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '1px',
              fontSize: '12px'
            }}>
              {item.productName}
            </div>
            {item.serialNumber && (
              <div style={{
                marginBottom: '1px',
                fontSize: '9px'
              }}>
                SN: {item.serialNumber}
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px'
            }}>
              <span>Qta: {item.quantity}</span>
              <span>€{item.unitPrice.toFixed(2)} x {item.quantity}</span>
              <span style={{ fontWeight: 'bold' }}>€{item.lineTotal.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
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
          <span>{ReceiptDataService.formatAmount(receiptData.totals.subtotalWithoutVAT)}</span>
        </div>
        {receiptData.totals.discountAmount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px',
            color: '#666'
          }}>
            <span>Sconto:</span>
            <span>-{ReceiptDataService.formatAmount(receiptData.totals.discountAmount)}</span>
          </div>
        )}
        {receiptData.totals.discountAmount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px'
          }}>
            <span>Subtotale scontato:</span>
            <span>{ReceiptDataService.formatAmount(receiptData.totals.finalSubtotal)}</span>
          </div>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2px'
        }}>
          <span>IVA (22%):</span>
          <span>{ReceiptDataService.formatAmount(receiptData.totals.vatAmount)}</span>
        </div>
        
        {/* Payment Methods */}
        {receiptData.payments.map((payment, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px',
            fontStyle: 'italic'
          }}>
            <span>{payment.label}</span>
            <span>{ReceiptDataService.formatAmount(payment.amount)}</span>
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
            <span>{ReceiptDataService.formatAmount(receiptData.totals.finalTotal)}</span>
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
        <div>{receiptData.saleInfo.saleDate}</div>
      </div>

      {/* Legal Terms */}
      <div style={{
        fontSize: '9px',
        lineHeight: '2.24',
        marginBottom: '8px',
        textAlign: 'center',
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: 'bold',
        width: '50%',
        margin: '0 auto'
      }}>
        <p>{receiptData.legalTerms.termsText}</p>
      </div>

      {/* Final Footer */}
      <div style={{
        textAlign: 'center',
        fontSize: '9px'
      }}>
        {receiptData.legalTerms.fiscalDisclaimer}
      </div>
    </>
  );
}