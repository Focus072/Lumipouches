/**
 * Shared types for monitoring service
 */

export interface ErrorContext {
  userId?: string;
  orderId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: 'ok' | 'error';
    r2?: 'ok' | 'error';
    veriff?: 'ok' | 'error';
    authorizenet?: 'ok' | 'error';
    shippo?: 'ok' | 'error';
  };
  timestamp: string;
}
