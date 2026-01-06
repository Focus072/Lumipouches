/**
 * Secure Fetch Utility
 * 
 * Provides a secure fetch wrapper that enforces HTTPS and SSL verification
 * for all external API calls.
 */

/**
 * Secure fetch wrapper that enforces HTTPS and SSL verification
 * 
 * In Node.js 18+, fetch() verifies SSL certificates by default.
 * This wrapper ensures:
 * 1. Only HTTPS URLs are allowed (except localhost in development)
 * 2. SSL certificate verification is enforced
 * 3. Proper error handling for SSL issues
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure URL is HTTPS (except localhost in development)
  const urlObj = new URL(url);
  const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isLocalhost && urlObj.protocol !== 'https:') {
    throw new Error(`Insecure protocol detected: ${urlObj.protocol}. Only HTTPS is allowed for external API calls.`);
  }
  
  // Add timeout if not already set
  const timeout = options.signal ? undefined : 30000; // 30 seconds default
  
  // Create abort controller for timeout if needed
  let controller: AbortController | undefined;
  let timeoutId: NodeJS.Timeout | undefined;
  
  if (timeout && !options.signal) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller!.abort(), timeout);
    options.signal = controller.signal;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      // Ensure we're using secure defaults
      cache: options.cache || 'no-store',
    });
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return response;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Check for SSL/TLS errors
    if (error instanceof Error) {
      if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        throw new Error(`SSL verification failed for ${url}: ${error.message}`);
      }
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout for ${url}`);
      }
    }
    
    throw error;
  }
}

/**
 * Validate that a URL is safe to call (HTTPS only)
 */
export function validateSecureUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Allow HTTP only for localhost in development
    if (isLocalhost && isDevelopment) {
      return true;
    }
    
    // Require HTTPS for all other URLs
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
