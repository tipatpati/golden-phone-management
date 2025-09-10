/**
 * Production-specific configurations and optimizations
 */

import { env } from './environment';

// Security Headers Configuration
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

if (env.IS_PRODUCTION) {
  securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
}

// Performance Optimizations
export const performanceConfig = {
  // Code splitting thresholds
  chunkSizeWarningLimit: 500,
  maxAssetSize: 250000,
  
  // Cache configuration
  cacheStrategy: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  },
  
  // Bundle optimization
  bundleAnalysis: {
    enabled: env.IS_PRODUCTION,
    threshold: 250, // KB
  }
};

// Error Tracking Configuration
export const errorTrackingConfig = {
  enabled: env.IS_PRODUCTION,
  sampleRate: 0.1, // 10% of errors in production
  beforeSend: (error: Error) => {
    // Filter out sensitive information
    if (error.message.includes('password') || error.message.includes('token')) {
      return null;
    }
    return error;
  }
};

// Monitoring Configuration
export const monitoringConfig = {
  enableAnalytics: env.IS_PRODUCTION,
  enableUserTracking: false, // Privacy-focused
  enablePerformanceTracking: env.IS_PRODUCTION,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};