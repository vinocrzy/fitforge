// ═══════════════════════════════════════════════════════════════════
// FitForge — App PIN Utilities (Phase 7)
//
// Each account can be protected by a 4–6-digit PIN that is required
// when switching to that profile on a shared device.
//
// SECURITY DESIGN:
//   - PBKDF2-SHA-256 with 100 000 iterations (OWASP 2024 recommendation)
//   - userId is the salt — each account produces a unique hash even if
//     two family members use the same PIN number.
//   - The derived hash is stored in localStorage (fitforge-auth). This
//     is acceptable for a local-first PWA where the device is the
//     trust boundary. It does NOT sync to CouchDB.
// ═══════════════════════════════════════════════════════════════════

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

/**
 * Derive a PBKDF2-SHA-256 hash from a plain-text PIN and the account's
 * stable userId (used as salt). Returns a 64-char hex string.
 *
 * Safe to call in SSR contexts — returns an empty string if the
 * Web Crypto API is unavailable.
 */
export async function hashPin(pin: string, userId: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    console.warn('[pin] Web Crypto unavailable — PIN hashing skipped');
    return '';
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(userId),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS,
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Returns true if the given plain-text PIN matches the stored PBKDF2 hash.
 */
export async function verifyPin(
  pin: string,
  userId: string,
  storedHash: string,
): Promise<boolean> {
  if (!storedHash) return true; // No PIN set — always pass
  const derived = await hashPin(pin, userId);
  return derived === storedHash;
}
