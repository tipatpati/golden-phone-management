/**
 * Centralized currency formatting utilities for Euro (EUR)
 * All currency formatting in the application should use these utilities
 */

export interface CurrencyFormatOptions {
  /** Whether to show decimals (default: true) */
  showDecimals?: boolean;
  /** Locale for formatting (default: 'it-IT') */
  locale?: string;
  /** Whether to use compact notation for large numbers (default: false) */
  compact?: boolean;
}

/**
 * Format a number as Euro currency using Italian locale
 */
export function formatCurrency(
  amount: number, 
  options: CurrencyFormatOptions = {}
): string {
  const {
    showDecimals = true,
    locale = 'it-IT',
    compact = false
  } = options;

  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  };

  if (compact && Math.abs(amount) >= 1000) {
    formatOptions.notation = 'compact';
    formatOptions.compactDisplay = 'short';
  }

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}

/**
 * Format currency with simplified Euro symbol (€) for basic display
 */
export function formatCurrencySimple(amount: number, showDecimals: boolean = true): string {
  return `€${amount.toFixed(showDecimals ? 2 : 0)}`;
}

/**
 * Format currency for employee salaries (no decimals, localized)
 */
export function formatSalary(amount: number): string {
  return formatCurrency(amount, { showDecimals: false });
}

/**
 * Format currency for financial reports and analytics
 */
export function formatFinancialAmount(amount: number, compact: boolean = false): string {
  return formatCurrency(amount, { compact });
}

/**
 * Format currency range (min - max)
 */
export function formatCurrencyRange(min: number, max: number): string {
  return `${formatCurrencySimple(min)} - ${formatCurrencySimple(max)}`;
}

/**
 * Parse currency string to number (removes Euro symbol and formats)
 */
export function parseCurrency(currencyString: string): number | null {
  const cleaned = currencyString.replace(/[€\s,]/g, '').replace(',', '.');
  const number = parseFloat(cleaned);
  return isNaN(number) ? null : number;
}