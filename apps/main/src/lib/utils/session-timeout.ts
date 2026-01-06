/**
 * Session timeout utilities
 * 
 * Handles automatic session expiration and logout
 */

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
export const SESSION_WARNING_MS = 5 * 60 * 1000; // Show warning 5 minutes before timeout

/**
 * Check if session is expired based on last activity
 */
export function isSessionExpired(lastActivity: number): boolean {
  const now = Date.now();
  return (now - lastActivity) > SESSION_TIMEOUT_MS;
}

/**
 * Get time until session expires
 */
export function getTimeUntilExpiry(lastActivity: number): number {
  const now = Date.now();
  const elapsed = now - lastActivity;
  return Math.max(0, SESSION_TIMEOUT_MS - elapsed);
}

/**
 * Check if warning should be shown
 */
export function shouldShowWarning(lastActivity: number): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(lastActivity);
  return timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_WARNING_MS;
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}
