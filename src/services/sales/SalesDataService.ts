import type { Sale } from './types';

/**
 * Service for handling sales data transformations and formatting
 */
export class SalesDataService {
  /**
   * Format client display name consistently (alias for compatibility)
   */
  static getClientDisplayName(client: any): string {
    if (!client) return 'Cliente non specificato';
    
    if (client.type === 'business' && client.company_name) {
      return client.company_name;
    }
    
    if (client.first_name || client.last_name) {
      return [client.first_name, client.last_name].filter(Boolean).join(' ');
    }
    
    return 'Cliente senza nome';
  }

  /**
   * Format date consistently
   */
  static formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Format payment method (alias for compatibility)
   */
  static formatPaymentMethod(method: string): string {
    return this.getPaymentMethodDisplay(method);
  }

  /**
   * Extract client name from sale data with proper fallback
   */
  static getClientName(sale: Sale): string {
    if (!sale.client) {
      return "Cliente Occasionale";
    }

    if (sale.client.type === "business") {
      return sale.client.company_name || sale.client.contact_person || "Azienda";
    } else {
      const firstName = sale.client.first_name?.trim() || "";
      const lastName = sale.client.last_name?.trim() || "";
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName) {
        return firstName;
      } else if (lastName) {
        return lastName;
      } else {
        return "Cliente Privato";
      }
    }
  }

  /**
   * Get formatted client info for display
   */
  static getClientInfo(sale: Sale) {
    if (!sale.client) {
      return { 
        name: "Cliente Occasionale", 
        type: "individual",
        displayType: "Privato"
      };
    }
    
    if (sale.client.type === "business") {
      return {
        name: sale.client.company_name || "Azienda",
        type: "business",
        displayType: "Azienda",
        contact: sale.client.contact_person,
        email: sale.client.email,
        phone: sale.client.phone
      };
    } else {
      return {
        name: this.getClientName(sale),
        type: "individual",
        displayType: "Privato",
        email: sale.client.email,
        phone: sale.client.phone
      };
    }
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }

  /**
   * Get status color for badges
   */
  static getStatusColor(status: string): "default" | "destructive" | "secondary" | "outline" {
    switch (status.toLowerCase()) {
      case "completed":
      case "completato":
        return "default";
      case "refunded":
      case "rimborsato":
        return "destructive";
      case "pending":
      case "in_attesa":
        return "secondary";
      case "cancelled":
      case "annullato":
        return "outline";
      default:
        return "outline";
    }
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodDisplay(paymentMethod: string): string {
    switch (paymentMethod.toLowerCase()) {
      case "cash":
        return "Contanti";
      case "card":
        return "Carta";
      case "bank_transfer":
        return "Bonifico Bancario";
      case "hybrid":
        return "Pagamento Ibrido";
      case "other":
        return "Altro";
      default:
        return paymentMethod.replace('_', ' ');
    }
  }

  /**
   * Get status display name
   */
  static getStatusDisplay(status: string): string {
    switch (status.toLowerCase()) {
      case "completed":
        return "Completato";
      case "pending":
        return "In Attesa";
      case "cancelled":
        return "Annullato";
      case "refunded":
        return "Rimborsato";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  /**
   * Calculate totals for sale items
   */
  static calculateTotals(items: any[], discountAmount: number = 0) {
    // Prices include 22% VAT, so we need to extract the base price
    const totalWithVAT = items.reduce((sum, item) => 
      sum + (Number(item.unit_price) * Number(item.quantity)), 0
    );
    
    const subtotal = totalWithVAT / 1.22; // Remove VAT to get base price
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = discountedSubtotal * 0.22; // 22% IVA
    const totalAmount = discountedSubtotal + taxAmount;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2))
    };
  }

  /**
   * Validate sale data before submission
   */
  static validateSaleData(saleData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!saleData.salesperson_id) {
      errors.push("ID venditore richiesto");
    }

    if (!saleData.payment_method) {
      errors.push("Metodo di pagamento richiesto");
    }

    if (!saleData.sale_items || saleData.sale_items.length === 0) {
      errors.push("Almeno un articolo richiesto");
    }

    // Validate price ranges
    if (saleData.sale_items) {
      saleData.sale_items.forEach((item: any, index: number) => {
        if (item.min_price && item.max_price) {
          if (item.unit_price < item.min_price || item.unit_price > item.max_price) {
            errors.push(`Prezzo dell'articolo ${index + 1} fuori dal range consentito`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format sale for search/display
   */
  static formatSaleForDisplay(sale: Sale) {
    return {
      ...sale,
      clientName: this.getClientName(sale),
      clientInfo: this.getClientInfo(sale),
      formattedTotal: this.formatCurrency(sale.total_amount),
      statusDisplay: this.getStatusDisplay(sale.status),
      paymentMethodDisplay: this.getPaymentMethodDisplay(sale.payment_method),
      statusColor: this.getStatusColor(sale.status)
    };
  }
}