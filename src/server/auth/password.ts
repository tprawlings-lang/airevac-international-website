import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing and policy.
 *
 * WHY SCRYPT AND NOT ARGON2ID. OWASP ranks argon2id first and scrypt an
 * accepted second. Argon2 for Node is always a native module, and a native
 * module is both a build that can fail on the host and a supply-chain
 * dependency sitting in the single worst place for one. scrypt is in the Node
 * standard library, has no install step, and at the parameters below is a
 * defensible choice for a console used by a handful of coordinators. The
 * parameters are stored inside the hash string, so raising them later upgrades
 * each user on their next login instead of requiring a migration.
 *
 * WHAT IS NEVER DONE HERE: no bare digest, no unsalted hash, no reversible
 * encryption, no password in a log line, and no comparison with `===`.
 */

/**
 * OWASP's recommended scrypt parameters. N is the work factor and dominates
 * cost; 2^17 takes roughly 100ms per hash on a modern server, which is slow
 * enough to make offline cracking expensive and fast enough that a coordinator
 * signing in does not notice.
 */
const PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * scrypt needs roughly 128 * N * r bytes. Node's default maxmem is 32 MB,
 * which is below what N=2^17 requires, so it must be raised explicitly or
 * every hash throws.
 */
const MAX_MEM = 256 * 1024 * 1024;

/** `scrypt$N$r$p$salt$key`, all base64url. Self-describing and portable. */
function encode(salt: Buffer, key: Buffer, params: typeof PARAMS): string {
  return [
    'scrypt',
    params.N,
    params.r,
    params.p,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

interface Decoded {
  params: { N: number; r: number; p: number };
  salt: Buffer;
  key: Buffer;
}

function decode(hash: string): Decoded | null {
  const parts = hash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null;

  const [, rawN, rawR, rawP, rawSalt, rawKey] = parts;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return null;
  // Refuse absurd parameters from a tampered row rather than trying to honour
  // them: a huge N is a denial of service against our own login endpoint.
  if (N < 2 ** 12 || N > 2 ** 20 || r < 1 || r > 32 || p < 1 || p > 16) return null;

  try {
    return {
      params: { N, r, p },
      salt: Buffer.from(rawSalt ?? '', 'base64url'),
      key: Buffer.from(rawKey ?? '', 'base64url'),
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, {
    ...PARAMS,
    maxmem: MAX_MEM,
  });
  return encode(salt, key, PARAMS);
}

export interface VerifyResult {
  valid: boolean;
  /** True when the stored hash used weaker parameters than current policy. */
  needsRehash: boolean;
}

/**
 * Verifies a password in constant time with respect to the key comparison.
 *
 * A malformed or unparseable stored hash returns invalid rather than throwing.
 * A row that cannot be read must not become a 500 that tells an attacker they
 * found something interesting.
 */
export async function verifyPassword(password: string, hash: string): Promise<VerifyResult> {
  const decoded = decode(hash);
  if (decoded === null) return { valid: false, needsRehash: false };

  const candidate = await scrypt(password.normalize('NFKC'), decoded.salt, decoded.key.length, {
    ...decoded.params,
    maxmem: MAX_MEM,
  });

  // Lengths must match before timingSafeEqual, which throws on a mismatch.
  const valid =
    candidate.length === decoded.key.length && timingSafeEqual(candidate, decoded.key);

  const needsRehash =
    decoded.params.N < PARAMS.N || decoded.params.r < PARAMS.r || decoded.params.p < PARAMS.p;

  return { valid, needsRehash };
}

/**
 * Passwords that may never be set, whatever the length rules say.
 *
 * `admin` heads the list for a specific reason: the first admin account is
 * seeded with that password so a demo can be opened without a credential hunt,
 * and it is forced to change on first use. This list is what stops it being
 * chosen again on the way out of that flow, which is exactly what a person in a
 * hurry would do.
 */
const FORBIDDEN = new Set([
  'admin',
  'password',
  'password1',
  'passw0rd',
  'airevac',
  'airevac1',
  'letmein',
  'welcome',
  'changeme',
  'qwerty',
  '12345678',
  '123456789',
  'iloveyou',
  'coordinator',
  'flightcoordinator',
]);

export interface PolicyResult {
  ok: boolean;
  problems: string[];
}

/**
 * Password policy.
 *
 * Length first, composition rules barely at all. NIST SP 800-63B withdrew the
 * upper-lower-digit-symbol requirements because they push people toward
 * `Password1!` and away from length, which is the property that actually
 * resists cracking. So: a real minimum, a blocklist, and a check that the
 * password is not simply the person's own email.
 */
export function checkPasswordPolicy(password: string, email?: string): PolicyResult {
  const problems: string[] = [];
  const normalized = password.normalize('NFKC');

  if (normalized.length < 12) {
    problems.push('Use at least 12 characters. Length matters more than symbols.');
  }
  // Bounded so a very long input cannot be used to make the server do minutes
  // of scrypt work per request.
  if (normalized.length > 256) {
    problems.push('Use fewer than 256 characters.');
  }
  if (FORBIDDEN.has(normalized.toLowerCase())) {
    problems.push('That password is too common. Choose something else.');
  }
  if (/^(.)\1+$/.test(normalized)) {
    problems.push('Do not use a single repeated character.');
  }
  if (email !== undefined && email !== '') {
    const local = email.split('@')[0]?.toLowerCase() ?? '';
    if (local.length > 2 && normalized.toLowerCase().includes(local)) {
      problems.push('Do not use your email address in your password.');
    }
  }

  return { ok: problems.length === 0, problems };
}

/**
 * A one-time password for an account an admin has just created.
 *
 * Readable rather than maximally random: it will be read aloud or pasted into a
 * message, and an unreadable string gets written on a sticky note. The account
 * is created with `must_change_password`, so this credential is valid only long
 * enough to choose a real one. Ambiguous characters are excluded.
 */
export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = randomBytes(20);
  let out = '';
  for (let i = 0; i < 20; i += 1) {
    if (i > 0 && i % 5 === 0) out += '-';
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}
