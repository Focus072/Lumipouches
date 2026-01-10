/**
 * Monitoring and Error Tracking Service
 * 
 * This is a wrapper that dynamically imports server/client implementations
 * to prevent @sentry/nextjs from being bundled in client code.
 * 
 * Environment variables:
 * - MONITORING_ENABLED=true (default: true in production)
 * - NEXT_PUBLIC_MONITORING_ENABLED=true (for client-side)
 * - SENTRY_DSN=your_sentry_dsn (required for Sentry integration)
 * - NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn (required for client-side Sentry)
 */

import type { ErrorContext, HealthCheckData } from './monitoring.types';

/**
 * Log error with context
 * Automatically uses server or client implementation
 */
export async function logError(error: unknown, context?: ErrorContext): Promise<void> {
  const isEnabled = process.env.MONITORING_ENABLED !== 'false';
  if (!isEnabled) return;

  // Basic console logging
  console.error('Error logged:', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });

  // Dynamically import server or client implementation
  if (typeof window === 'undefined') {
    const { logErrorServer } = await import('./monitoring.server');
    await logErrorServer(error, context);
  } else {
    const { logErrorClient } = await import('./monitoring.client');
    logErrorClient(error, context);
  }
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  const isEnabled = process.env.MONITORING_ENABLED !== 'false';
  if (!isEnabled) return;

  // Basic logging (can be extended to send to analytics service)
  if (process.env.NODE_ENV === 'development') {
    console.log('Event tracked:', {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    });
  }

  // TODO: Integrate with analytics service (e.g., Mixpanel, Amplitude)
}

/**
 * Track performance metric
 */
export function trackMetric(metricName: string, value: number, tags?: Record<string, string>): void {
  const isEnabled = process.env.MONITORING_ENABLED !== 'false';
  if (!isEnabled) return;

  // Basic logging (can be extended to send to metrics service)
  if (process.env.NODE_ENV === 'development') {
    console.log('Metric tracked:', {
      metric: metricName,
      value,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  // TODO: Integrate with metrics service (e.g., DataDog, CloudWatch)
}

/**
 * Perform health checks (server-side only)
 * Re-exported from monitoring.server.ts
 */
export async function performHealthChecks(): Promise<HealthCheckData> {
  if (typeof window !== 'undefined') {
    throw new Error('performHealthChecks can only be called server-side');
  }
  const { performHealthChecks: serverPerformHealthChecks } = await import('./monitoring.server');
  return serverPerformHealthChecks();
}

// Re-export types
export type { ErrorContext, HealthCheckData } from './monitoring.types';
