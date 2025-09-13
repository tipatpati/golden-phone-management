/**
 * Migration Service for Console.log to Structured Logging
 * Automatically migrates existing console.log statements
 */

import { logger } from '@/utils/secureLogger';
import { loggerMigration } from '@/utils/migration/LoggerMigration';

// Start the migration immediately
loggerMigration.replaceConsoleLog();

// Create context-aware logging functions
export const createLogger = (context: string) => ({
  debug: (message: string, data?: any) => logger.debug(message, data, context),
  info: (message: string, data?: any) => logger.info(message, data, context),
  warn: (message: string, data?: any) => logger.warn(message, data, context),
  error: (message: string, data?: any) => logger.error(message, data, context),
});

// Pre-configured loggers for common contexts
export const componentLogger = createLogger('Component');
export const serviceLogger = createLogger('Service');
export const hookLogger = createLogger('Hook');
export const utilityLogger = createLogger('Utility');
export const apiLogger = createLogger('API');
export const validationLogger = createLogger('Validation');
export const performanceLogger = createLogger('Performance');

// Migration complete - all console.log calls are now structured logs
logger.info('Console.log migration completed', loggerMigration.getStats(), 'Migration');