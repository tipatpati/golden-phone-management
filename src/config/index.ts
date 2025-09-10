/**
 * Production-ready application configuration
 * Centralizes all configuration management
 */

import { env, config } from './environment';
import { securityHeaders, performanceConfig } from './production';
import { errorTracking } from '../services/core/ErrorTracking';

// Initialize error tracking for production
if (env.IS_PRODUCTION) {
  errorTracking.addBreadcrumb('Application started', 'system');
}

// Export all configuration
export {
  env,
  config,
  securityHeaders,
  performanceConfig,
  errorTracking
};

// Production optimization - disable console in production builds
if (env.IS_PRODUCTION) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.warn and console.error for critical issues
}

export default {
  environment: env,
  app: config,
  security: securityHeaders,
  performance: performanceConfig
};
