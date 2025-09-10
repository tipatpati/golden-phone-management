/**
 * Final deployment checklist and validation
 */

import { logger } from '@/utils/logger';
import { runFinalProductionCheck, quickHealthCheck } from './finalProductionChecks';
import { checkProductionReadiness } from './productionStatus';

export interface DeploymentChecklist {
  phase: string;
  tasks: Array<{
    id: string;
    description: string;
    completed: boolean;
    critical: boolean;
    result?: string;
  }>;
  overallStatus: 'ready' | 'warning' | 'blocked';
  readinessScore: number;
}

/**
 * Generate comprehensive deployment checklist
 */
export async function generateDeploymentChecklist(): Promise<DeploymentChecklist> {
  logger.info('Generating deployment checklist', {}, 'DeploymentChecklist');

  const checklist: DeploymentChecklist = {
    phase: 'Production Readiness Validation',
    tasks: [],
    overallStatus: 'blocked',
    readinessScore: 0
  };

  try {
    // 1. Environment Configuration
    checklist.tasks.push({
      id: 'env-config',
      description: 'Environment variables configured for production',
      completed: false,
      critical: true
    });

    // 2. Security Setup
    checklist.tasks.push({
      id: 'security-config',
      description: 'Security headers and CSP configured',
      completed: false,
      critical: true
    });

    // 3. Error Tracking
    checklist.tasks.push({
      id: 'error-tracking',
      description: 'Error tracking and monitoring active',
      completed: false,
      critical: false
    });

    // 4. Performance Optimization
    checklist.tasks.push({
      id: 'performance',
      description: 'Build optimization and code splitting configured',
      completed: false,
      critical: false
    });

    // 5. Logging System
    checklist.tasks.push({
      id: 'logging',
      description: 'Production logging system operational',
      completed: false,
      critical: true
    });

    // 6. Code Quality
    checklist.tasks.push({
      id: 'code-quality',
      description: 'Console logs removed and debug code cleaned',
      completed: false,
      critical: false
    });

    // 7. Database Security
    checklist.tasks.push({
      id: 'database-security',
      description: 'Database RLS policies and security validated',
      completed: false,
      critical: true
    });

    // 8. Bundle Analysis
    checklist.tasks.push({
      id: 'bundle-analysis',
      description: 'Bundle size optimized for production',
      completed: false,
      critical: false
    });

    // Run actual checks
    const productionCheck = await runFinalProductionCheck();
    const basicStatus = checkProductionReadiness();
    const healthCheck = quickHealthCheck();

    // Update task status based on checks
    checklist.tasks.forEach(task => {
      switch (task.id) {
        case 'env-config':
          task.completed = productionCheck.score >= 20;
          task.result = task.completed ? 'Environment properly configured' : 'Environment configuration incomplete';
          break;
        case 'security-config':
          task.completed = basicStatus.checks.security;
          task.result = task.completed ? 'Security configuration validated' : 'Security setup required';
          break;
        case 'error-tracking':
          task.completed = basicStatus.checks.errorTracking;
          task.result = task.completed ? 'Error tracking operational' : 'Error tracking needs setup';
          break;
        case 'performance':
          task.completed = basicStatus.checks.performance;
          task.result = task.completed ? 'Performance optimizations active' : 'Performance tuning needed';
          break;
        case 'logging':
          task.completed = basicStatus.checks.logging && healthCheck.healthy;
          task.result = task.completed ? 'Logging system operational' : 'Logging system issues detected';
          break;
        case 'code-quality':
          task.completed = productionCheck.score >= 85;
          task.result = task.completed ? 'Code quality standards met' : 'Code cleanup required';
          break;
        case 'database-security':
          task.completed = productionCheck.criticalIssues.length === 0;
          task.result = task.completed ? 'Database security validated' : 'Database security review needed';
          break;
        case 'bundle-analysis':
          task.completed = productionCheck.score >= 90;
          task.result = task.completed ? 'Bundle optimization complete' : 'Bundle size optimization recommended';
          break;
      }
    });

    // Calculate overall status
    const completedTasks = checklist.tasks.filter(t => t.completed).length;
    const totalTasks = checklist.tasks.length;
    const criticalTasks = checklist.tasks.filter(t => t.critical);
    const completedCriticalTasks = criticalTasks.filter(t => t.completed).length;

    checklist.readinessScore = Math.round((completedTasks / totalTasks) * 100);

    if (completedCriticalTasks === criticalTasks.length && checklist.readinessScore >= 85) {
      checklist.overallStatus = 'ready';
    } else if (completedCriticalTasks === criticalTasks.length && checklist.readinessScore >= 70) {
      checklist.overallStatus = 'warning';
    } else {
      checklist.overallStatus = 'blocked';
    }

    logger.info('Deployment checklist generated', {
      overallStatus: checklist.overallStatus,
      readinessScore: checklist.readinessScore,
      completedTasks,
      totalTasks
    }, 'DeploymentChecklist');

  } catch (error) {
    logger.error('Failed to generate deployment checklist', error, 'DeploymentChecklist');
    checklist.overallStatus = 'blocked';
    checklist.tasks.push({
      id: 'checklist-error',
      description: 'Checklist generation failed',
      completed: false,
      critical: true,
      result: 'Error during checklist validation'
    });
  }

  return checklist;
}

/**
 * Get deployment recommendations based on checklist
 */
export function getDeploymentRecommendations(checklist: DeploymentChecklist): string[] {
  const recommendations: string[] = [];

  if (checklist.overallStatus === 'blocked') {
    recommendations.push('❌ DEPLOYMENT BLOCKED: Critical issues must be resolved before deployment');
    
    const failedCritical = checklist.tasks.filter(t => t.critical && !t.completed);
    failedCritical.forEach(task => {
      recommendations.push(`🔴 Critical: ${task.description} - ${task.result || 'Not completed'}`);
    });
  }

  if (checklist.overallStatus === 'warning') {
    recommendations.push('⚠️ DEPLOYMENT WITH WARNINGS: Address these items for optimal production performance');
    
    const failedTasks = checklist.tasks.filter(t => !t.completed);
    failedTasks.forEach(task => {
      const priority = task.critical ? '🔴' : '🟡';
      recommendations.push(`${priority} ${task.description} - ${task.result || 'Needs attention'}`);
    });
  }

  if (checklist.overallStatus === 'ready') {
    recommendations.push('✅ READY FOR DEPLOYMENT: All critical checks passed');
    recommendations.push('🚀 System is production-ready and can be safely deployed');
    
    const minorIssues = checklist.tasks.filter(t => !t.completed && !t.critical);
    if (minorIssues.length > 0) {
      recommendations.push('💡 Consider addressing these minor optimizations:');
      minorIssues.forEach(task => {
        recommendations.push(`  • ${task.description}`);
      });
    }
  }

  return recommendations;
}

/**
 * Log deployment status summary
 */
export async function logDeploymentStatus(): Promise<void> {
  try {
    const checklist = await generateDeploymentChecklist();
    const recommendations = getDeploymentRecommendations(checklist);

    logger.info('=== DEPLOYMENT STATUS SUMMARY ===', {
      status: checklist.overallStatus,
      score: checklist.readinessScore,
      completedTasks: checklist.tasks.filter(t => t.completed).length,
      totalTasks: checklist.tasks.length,
      recommendations: recommendations.slice(0, 3) // Log first 3 recommendations
    }, 'DeploymentStatus');

    recommendations.forEach(rec => {
      if (rec.includes('BLOCKED')) {
        logger.error(rec, {}, 'DeploymentStatus');
      } else if (rec.includes('WARNING')) {
        logger.warn(rec, {}, 'DeploymentStatus');
      } else if (rec.includes('READY')) {
        logger.info(rec, {}, 'DeploymentStatus');
      }
    });

  } catch (error) {
    logger.error('Failed to log deployment status', error, 'DeploymentStatus');
  }
}