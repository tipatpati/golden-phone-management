/**
 * Enhanced Data Sanitizer
 * Provides comprehensive data sanitization and validation for security
 */

import { logger } from '@/utils/logger';

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  allowedCharacters?: RegExp;
  encoding?: 'html' | 'url' | 'base64';
}

export class DataSanitizer {
  private static instance: DataSanitizer;
  
  // Common XSS patterns to detect and remove
  private readonly xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
  ];

  // SQL injection patterns
  private readonly sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/gi,
    /((\b(AND|OR)\b.{1,6}?(=|>|<|\!|<=|>=))|(\b(AND|OR)\b\s*([\w]+)\s*(=|>|<|\!|<=|>=)))/gi,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(\s*\d+\s*\))/gi
  ];

  private constructor() {}

  static getInstance(): DataSanitizer {
    if (!DataSanitizer.instance) {
      DataSanitizer.instance = new DataSanitizer();
    }
    return DataSanitizer.instance;
  }

  /**
   * Sanitize user input for storage and display
   */
  sanitizeInput(input: unknown, options: SanitizationOptions = {}): string {
    if (input === null || input === undefined) {
      return '';
    }

    let sanitized = String(input);

    // Length validation
    if (options.maxLength && sanitized.length > options.maxLength) {
      logger.warn('Input length exceeded maximum', { 
        length: sanitized.length, 
        maxLength: options.maxLength 
      }, 'DataSanitizer');
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Character validation
    if (options.allowedCharacters && !options.allowedCharacters.test(sanitized)) {
      logger.warn('Input contains disallowed characters', { input: sanitized }, 'DataSanitizer');
      sanitized = sanitized.replace(new RegExp(`[^${options.allowedCharacters.source}]`, 'g'), '');
    }

    // XSS protection
    if (!options.allowHtml) {
      sanitized = this.removeXSS(sanitized);
    }

    // SQL injection protection
    sanitized = this.removeSQLInjection(sanitized);

    // Encoding
    if (options.encoding) {
      sanitized = this.encode(sanitized, options.encoding);
    }

    return sanitized.trim();
  }

  /**
   * Sanitize object properties recursively
   */
  sanitizeObject<T extends Record<string, any>>(obj: T, options: SanitizationOptions = {}): T {
    const sanitized = { ...obj } as Record<string, any>;

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value, options);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value, options);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeInput(item, options) : 
          typeof item === 'object' ? this.sanitizeObject(item, options) : item
        );
      }
    }

    return sanitized as T;
  }

  /**
   * Validate and sanitize form data
   */
  sanitizeFormData<T extends Record<string, any>>(formData: T): T {
    const options: SanitizationOptions = {
      allowHtml: false,
      maxLength: 1000,
      allowedCharacters: /[\w\s\-.,@#$%&()[\]{}:;"'+=?/\\!]/
    };

    return this.sanitizeObject(formData, options);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.sanitizeInput(email);
    return emailRegex.test(sanitized) && sanitized.length <= 254;
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const sanitized = this.sanitizeInput(phone).replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(sanitized);
  }

  /**
   * Validate IMEI/Serial number
   */
  validateSerial(serial: string): boolean {
    const sanitized = this.sanitizeInput(serial).replace(/\D/g, '');
    return sanitized.length === 15 && /^\d{15}$/.test(sanitized);
  }

  private removeXSS(input: string): string {
    let sanitized = input;
    
    // Remove XSS patterns
    for (const pattern of this.xssPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // HTML encode remaining special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  private removeSQLInjection(input: string): string {
    let sanitized = input;
    
    // Check for SQL injection patterns
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(sanitized)) {
        logger.warn('Potential SQL injection attempt detected', { input }, 'DataSanitizer');
        // Remove suspicious patterns
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return sanitized;
  }

  private encode(input: string, encoding: 'html' | 'url' | 'base64'): string {
    switch (encoding) {
      case 'html':
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      
      case 'url':
        return encodeURIComponent(input);
      
      case 'base64':
        return btoa(input);
      
      default:
        return input;
    }
  }
}

export const dataSanitizer = DataSanitizer.getInstance();