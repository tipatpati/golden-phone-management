/**
 * Final production readiness validation and deployment preparation
 */

import { logger } from '@/utils/logger';
import { env } from '@/config/environment';
import { errorTracking } from '@/services/core/ErrorTracking';
import { checkProductionReadiness, productionMetrics } from './productionStatus';

interface FinalCheckResult {
  readyForProduction: boolean;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  score: number; // 0-100
}

/**
 * Comprehensive final production check
 */
export async function runFinalProductionCheck(): Promise<FinalCheckResult> {
  logger.info('Starting final production readiness check', {}, 'FinalProductionCheck');

  const result: FinalCheckResult = {
    readyForProduction: false,
    criticalIssues: [],
    warnings: [],
    recommendations: [],
    score: 0
  };

  let score = 0;
  const maxScore = 100;

  try {
    // 1. Environment Configuration (20 points)
    if (env.IS_PRODUCTION) {
      score += 20;
      logger.info('✅ Environment configured for production', {}, 'FinalProductionCheck');
    } else {
      result.warnings.push('Not running in production mode');
    }

    // 2. Error Tracking (15 points)
    try {
      errorTracking.addBreadcrumb('Final production check', 'system');
      score += 15;
      logger.info('✅ Error tracking operational', {}, 'FinalProductionCheck');
    } catch {
      result.criticalIssues.push('Error tracking not functional');
    }

    // 3. Security Configuration (25 points)
    const productionStatus = checkProductionReadiness();
    if (productionStatus.checks.security) {
      score += 25;
      logger.info('✅ Security configuration validated', {}, 'FinalProductionCheck');
    } else {
      result.criticalIssues.push('Security configuration incomplete');
    }

    // 4. Performance Optimizations (20 points)
    if (productionStatus.checks.performance) {
      score += 20;
      logger.info('✅ Performance optimizations active', {}, 'FinalProductionCheck');
    } else {
      result.warnings.push('Performance optimizations not fully configured');
    }

    // 5. Logging System (10 points)
    if (productionStatus.checks.logging) {
      score += 10;
      logger.info('✅ Logging system operational', {}, 'FinalProductionCheck');
    } else {
      result.criticalIssues.push('Logging system not functional');
    }

    // 6. Build Configuration (10 points)
    try {
      // Check if running in optimized build
      if (typeof window !== 'undefined' && !window.location.host.includes('localhost')) {
        score += 10;
        logger.info('✅ Running in optimized build environment', {}, 'FinalProductionCheck');
      } else {
        result.warnings.push('Running in development environment');
      }
    } catch {
      result.warnings.push('Could not verify build environment');
    }

    result.score = score;

    // Determine readiness
    result.readyForProduction = score >= 85 && result.criticalIssues.length === 0;

    // Generate recommendations
    if (score < 85) {
      result.recommendations.push('Address remaining configuration items to reach production readiness threshold');
    }

    if (result.criticalIssues.length > 0) {
      result.recommendations.push('Fix all critical issues before deployment');
    }

    if (result.warnings.length > 0) {
      result.recommendations.push('Review warnings and address if applicable to your deployment');
    }

    if (result.readyForProduction) {
      result.recommendations.push('System is ready for production deployment');
      logger.info('🎉 System ready for production deployment', { score }, 'FinalProductionCheck');
    } else {
      logger.warn('⚠️ System not yet ready for production', { 
        score, 
        criticalIssues: result.criticalIssues.length,
        warnings: result.warnings.length 
      }, 'FinalProductionCheck');
    }

    // Log performance metrics
    if (env.IS_PRODUCTION) {
      productionMetrics.logStartupMetrics();
      productionMetrics.monitorBundlePerformance();
    }

  } catch (error) {
    logger.error('Final production check failed', error, 'FinalProductionCheck');
    result.criticalIssues.push('Production check process failed');
  }

  return result;
}

/**
 * Quick production health check for monitoring
 */
export function quickHealthCheck(): { healthy: boolean; issues: string[] } {
  const issues: string[] = [];
  
  try {
    // Basic checks
    if (!env.IS_PRODUCTION) {
      issues.push('Not in production mode');
    }

    // Logger check
    try {
      logger.info('Health check ping', {}, 'HealthCheck');
    } catch {
      issues.push('Logger not functional');
    }

    // Error tracking check
    try {
      errorTracking.addBreadcrumb('Health check', 'system');
    } catch {
      issues.push('Error tracking not functional');
    }

    return {
      healthy: issues.length === 0,
      issues
    };

  } catch (error) {
    return {
      healthy: false,
      issues: ['Health check failed to execute']
    };
  }
}

/**
 * Initialize production deployment
 */
export async function initializeProductionDeployment(): Promise<void> {
  logger.info('Initializing production deployment', {}, 'ProductionDeployment');

  try {
    // Run final checks
    const checkResult = await runFinalProductionCheck();
    
    if (!checkResult.readyForProduction) {
      throw new Error(`Production deployment blocked: ${checkResult.criticalIssues.join(', ')}`);
    }

    // Initialize production systems
    if (env.IS_PRODUCTION) {
      // Start monitoring
      productionMetrics.logStartupMetrics();
      
      // Initialize error tracking
      errorTracking.addBreadcrumb('Production deployment initialized', 'system');
      
      logger.info('✅ Production deployment initialized successfully', {
        score: checkResult.score,
        warnings: checkResult.warnings.length
      }, 'ProductionDeployment');
    }

  } catch (error) {
    logger.error('Production deployment initialization failed', error, 'ProductionDeployment');
    throw error;
  }
}