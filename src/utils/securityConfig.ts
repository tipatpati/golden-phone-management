/**
 * Security configuration and headers for production
 */

import { env } from '@/config/environment';

/**
 * Content Security Policy configuration
 */
export const cspConfig = {
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'",   // Required for some libraries
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS libraries
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://images.unsplash.com',
      'https://via.placeholder.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      env.IS_DEVELOPMENT ? 'ws://localhost:*' : ''
    ].filter(Boolean),
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': env.IS_PRODUCTION ? [] : undefined
  }
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': Object.entries(cspConfig.directives)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(' ') : value}`)
    .join('; '),
    
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '),
  
  // HTTP Strict Transport Security (HTTPS only)
  ...(env.IS_PRODUCTION && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
};

/**
 * Security meta tags for HTML head
 */
export const securityMetaTags = [
  {
    httpEquiv: 'Content-Security-Policy',
    content: securityHeaders['Content-Security-Policy']
  },
  {
    httpEquiv: 'X-Content-Type-Options',
    content: 'nosniff'
  },
  {
    httpEquiv: 'X-Frame-Options',
    content: 'DENY'
  },
  {
    httpEquiv: 'X-XSS-Protection',
    content: '1; mode=block'
  },
  {
    httpEquiv: 'Referrer-Policy',
    content: 'strict-origin-when-cross-origin'
  }
];

/**
 * Runtime security checks
 */
export const securityChecks = {
  /**
   * Validate that the app is running over HTTPS in production
   */
  checkHTTPS: () => {
    if (env.IS_PRODUCTION && window.location.protocol !== 'https:') {
      console.error('Production app must run over HTTPS');
      return false;
    }
    return true;
  },
  
  /**
   * Check for mixed content issues
   */
  checkMixedContent: () => {
    if (env.IS_PRODUCTION) {
      const scripts = document.querySelectorAll('script[src]');
      const links = document.querySelectorAll('link[href]');
      const images = document.querySelectorAll('img[src]');
      
      const allResources = [
        ...Array.from(scripts).map(s => s.getAttribute('src')),
        ...Array.from(links).map(l => l.getAttribute('href')),
        ...Array.from(images).map(i => i.getAttribute('src'))
      ].filter(Boolean);
      
      const insecureResources = allResources.filter(url => 
        url && url.startsWith('http://') && !url.includes('localhost')
      );
      
      if (insecureResources.length > 0) {
        console.warn('Insecure resources detected:', insecureResources);
        return false;
      }
    }
    return true;
  },
  
  /**
   * Validate CSP implementation
   */
  checkCSP: () => {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (env.IS_PRODUCTION && !cspMeta) {
      console.warn('Content Security Policy not implemented');
      return false;
    }
    return true;
  }
};

/**
 * Initialize security configurations
 */
export const initializeSecurity = () => {
  // Add security meta tags if not present
  securityMetaTags.forEach(tag => {
    const existing = document.querySelector(
      `meta[http-equiv="${tag.httpEquiv}"]`
    );
    
    if (!existing) {
      const meta = document.createElement('meta');
      meta.httpEquiv = tag.httpEquiv;
      meta.content = tag.content;
      document.head.appendChild(meta);
    }
  });
  
  // Run security checks
  const checks = [
    securityChecks.checkHTTPS(),
    securityChecks.checkMixedContent(),
    securityChecks.checkCSP()
  ];
  
  const allPassed = checks.every(check => check);
  
  if (env.IS_PRODUCTION && !allPassed) {
    console.error('Security validation failed. Please review security configuration.');
  }
  
  return allPassed;
};