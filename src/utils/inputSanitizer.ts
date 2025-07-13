
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
