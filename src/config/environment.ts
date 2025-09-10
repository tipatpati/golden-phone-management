/**
 * Centralized environment configuration and validation
 */

import { logger } from '@/utils/logger';

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  IS_TEST: boolean;
}

function validateEnvironment(): EnvironmentConfig {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(message, { missing }, 'Environment');
    throw new Error(message);
  }

  const nodeEnv = (import.meta.env.MODE || 'development') as EnvironmentConfig['NODE_ENV'];

  return {
    NODE_ENV: nodeEnv,
    SUPABASE_URL: requiredVars.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: requiredVars.VITE_SUPABASE_ANON_KEY,
    IS_PRODUCTION: nodeEnv === 'production',
    IS_DEVELOPMENT: nodeEnv === 'development',
    IS_TEST: nodeEnv === 'test',
  };
}

export const env = validateEnvironment();

export const config = {
  // API Configuration
  api: {
    timeout: env.IS_PRODUCTION ? 10000 : 30000,
    retries: env.IS_PRODUCTION ? 3 : 1,
  },

  // Logging Configuration
  logging: {
    level: env.IS_PRODUCTION ? 'error' : 'debug',
    bufferSize: env.IS_PRODUCTION ? 50 : 100,
  },

  // Performance Configuration
  performance: {
    enableMemoryMonitoring: env.IS_DEVELOPMENT,
    enablePerformanceLogging: env.IS_DEVELOPMENT,
    virtualScrollThreshold: 100,
  },

  // Security Configuration
  security: {
    enableCSP: env.IS_PRODUCTION,
    enableHSTS: env.IS_PRODUCTION,
    enforceSecure: env.IS_PRODUCTION,
  },
};