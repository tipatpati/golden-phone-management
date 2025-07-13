
// Enhanced input sanitization utilities for security
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .slice(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  // Basic email sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeInput(email.toLowerCase());
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove non-numeric characters except + and -
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
};

export const validateNumericInput = (value: string | number): number | null => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) || !isFinite(num) ? null : num;
};

export const validatePriceInput = (value: string | number, min = 0, max = 999999): number | null => {
  const num = validateNumericInput(value);
  if (num === null) return null;
  return num >= min && num <= max ? num : null;
};

export const validateQuantityInput = (value: string | number): number | null => {
  const num = validateNumericInput(value);
  if (num === null) return null;
  return Number.isInteger(num) && num >= 0 && num <= 100000 ? num : null;
};

export const rateLimiter = (() => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT = 10; // requests per minute
  const WINDOW_MS = 60000; // 1 minute

  return (key: string): boolean => {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record || now > record.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
      return true;
    }

    if (record.count >= RATE_LIMIT) {
      return false;
    }

    record.count++;
    return true;
  };
})();
