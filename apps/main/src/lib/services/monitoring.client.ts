/**
 * Client-side monitoring and error tracking
 * 
 * Never imports server packages like @sentry/nextjs
 */

import type { ErrorContext } from './monitoring.types';

/**
 * Log error with context (client-side only)
 */
export function logErrorClient(error: unknown, context?: ErrorContext): void {
  const isEnabled = process.env.NEXT_PUBLIC_MONITORING_ENABLED !== 'false';
  if (!isEnabled) return;

  const sentry = (window as any).Sentry;
  if (!sentry?.captureException) return;

  sentry.captureException(error, {
    extra: context
      ? {
          userId: context.userId,
          orderId: context.orderId,
          requestId: context.requestId,
          ...context.metadata,
        }
      : undefined,
    tags: { component: context?.metadata?.component || 'unknown' },
  });
}
