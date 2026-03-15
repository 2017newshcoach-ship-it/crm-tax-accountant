// Input validation utilities

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates username format
 * - 3-20 characters
 * - Alphanumeric and underscores only
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validates password strength
 * - At least 8 characters
 * - Contains at least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Validates phone number format (Korean)
 * Accepts formats: 010-1234-5678, 01012345678, etc.
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates business registration number (Korean)
 * Format: XXX-XX-XXXXX
 */
export function isValidBusinessNumber(number: string): boolean {
  const businessRegex = /^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/;
  return businessRegex.test(number);
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates date string (ISO format)
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validates file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 50): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxBytes;
}

/**
 * Validates file type
 */
export function isValidFileType(mimeType: string, allowedTypes?: string[]): boolean {
  const defaultAllowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];
  
  const typesToCheck = allowedTypes || defaultAllowedTypes;
  return typesToCheck.includes(mimeType);
}

/**
 * Rate limiting helper - simple in-memory store
 * For production, use Redis or a proper rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Cleans up expired rate limit records
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);