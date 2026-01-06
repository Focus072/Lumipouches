/**
 * Input Sanitization Utility
 * 
 * Provides functions to sanitize user input to prevent XSS attacks
 * and other injection attacks.
 */

/**
 * Sanitize a string by removing/escaping potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Remove whitespace and convert to lowercase
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation (Zod will do full validation)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize a URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }
  
  const sanitized = url.trim();
  
  // Only allow http, https, and relative URLs
  if (!/^(https?:\/\/|\/)/.test(sanitized)) {
    return '';
  }
  
  // Remove javascript: and data: protocols
  if (/^(javascript|data):/i.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : 
        item
      ) as any;
    }
  }
  
  return sanitized;
}

/**
 * Enhanced Zod string schema with sanitization
 */
import { z } from 'zod';

export const sanitizedString = z.string().transform((val) => sanitizeString(val));
export const sanitizedEmail = z.string().email().transform((val) => sanitizeEmail(val));
export const sanitizedUrl = z.string().url().transform((val) => sanitizeUrl(val));
