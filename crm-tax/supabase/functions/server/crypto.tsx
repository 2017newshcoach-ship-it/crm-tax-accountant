/**
 * Password hashing utilities using Web Crypto API
 * Compatible with Supabase Edge Functions (Deno Deploy)
 */

const SALT_LENGTH = 16;
const HASH_ITERATIONS = 100000;
const KEY_LENGTH = 32;

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  // Convert password to bytes
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  const hashArray = new Uint8Array(hashBuffer);
  
  // Combine salt and hash
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(hashedPassword), c => c.charCodeAt(0));
    
    // Extract salt and hash
    const salt = combined.slice(0, SALT_LENGTH);
    const originalHash = combined.slice(SALT_LENGTH);
    
    // Convert password to bytes
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    // Derive key using PBKDF2 with the same salt
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: HASH_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_LENGTH * 8
    );
    
    const newHash = new Uint8Array(hashBuffer);
    
    // Compare hashes
    if (newHash.length !== originalHash.length) {
      return false;
    }
    
    for (let i = 0; i < newHash.length; i++) {
      if (newHash[i] !== originalHash[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[CRYPTO] Password verification error:', error);
    return false;
  }
}
