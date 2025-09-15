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
  // Use direct Supabase configuration values (no VITE_* variables in Lovable)
  const SUPABASE_URL = 'https://joiwowvlujajwbarpsuc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvaXdvd3ZsdWphandiYXJwc3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NjY5NDEsImV4cCI6MjA2NTQ0Mjk0MX0.0zl0V76SCadbeuFw7VfzaKfvKdMb18KuEji26VbU3mw';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const message = 'Supabase configuration is missing';
    logger.error(message, {}, 'Environment');
    throw new Error(message);
  }

  const nodeEnv = (import.meta.env.MODE || 'development') as EnvironmentConfig['NODE_ENV'];

  return {
    NODE_ENV: nodeEnv,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
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