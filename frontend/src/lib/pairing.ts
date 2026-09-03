import type { DeviceSecurity, Fridge } from '@/types'
import { derivePairingDigest, randomHex, timingSafeEqual } from '@/lib/crypto'

/* -------------------------------------------------------------------------- */
/*  Policy                                                                     */
/* -------------------------------------------------------------------------- */

/** Wrong attempts allowed before the hub stops answering for a while. */
export const MAX_ATTEMPTS = 5
/** How long the hub refuses pairing after the limit is reached. */
export const LOCKOUT_MS = 60_000
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 64

export function createSecurity(factoryPassword: string, options: Partial<DeviceSecurity> = {}): DeviceSecurity {
  const salt = options.salt ?? randomHex(8)
  return {
    salt,
    factoryPassword,
    passwordDigest: options.passwordDigest ?? derivePairingDigest(factoryPassword, salt),
    usingFactoryPassword: options.usingFactoryPassword ?? true,
    failedAttempts: 0,
    ...options,
    // Never carried over from a template.
    pairingToken: options.pairingToken,
    pairedAt: options.pairedAt,
  }
}

/* -------------------------------------------------------------------------- */
/*  Lockout                                                                    */
/* -------------------------------------------------------------------------- */

export function lockoutRemainingMs(security: DeviceSecurity, now = Date.now()): number {
  if (!security.lockedUntil) return 0
  return Math.max(0, security.lockedUntil - now)
}

export function isLockedOut(security: DeviceSecurity, now = Date.now()): boolean {
  return lockoutRemainingMs(security, now) > 0
}

export function attemptsRemaining(security: DeviceSecurity): number {
  return Math.max(0, MAX_ATTEMPTS - security.failedAttempts)
}

export function formatLockout(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes > 0 ? `${minutes}:${`${seconds}`.padStart(2, '0')}` : `${seconds}s`
}

/* -------------------------------------------------------------------------- */
/*  Verification                                                               */
/* -------------------------------------------------------------------------- */

export type PairingOutcome =
  | { status: 'paired'; token: string; usingFactoryPassword: boolean }
  | { status: 'wrong-password'; attemptsRemaining: number }
  | { status: 'locked'; remainingMs: number }
  | { status: 'offline' }

/**
 * The hub side of the handshake: check the password against the stored digest,
 * count failures, and issue a pairing token only on success.
 */
export function verifyPairing(fridge: Fridge, password: string, now = Date.now()): PairingOutcome {
  const { security } = fridge

  if (!fridge.online) return { status: 'offline' }

  const remaining = lockoutRemainingMs(security, now)
  if (remaining > 0) return { status: 'locked', remainingMs: remaining }

  const digest = derivePairingDigest(password, security.salt)
  if (!timingSafeEqual(digest, security.passwordDigest)) {
    const failedAttempts = security.failedAttempts + 1
    return { status: 'wrong-password', attemptsRemaining: Math.max(0, MAX_ATTEMPTS - failedAttempts) }
  }

  return {
    status: 'paired',
    token: randomHex(24),
    usingFactoryPassword: security.usingFactoryPassword,
  }
}

/* -------------------------------------------------------------------------- */
/*  Password rules                                                             */
/* -------------------------------------------------------------------------- */

export interface PasswordRule {
  id: string
  label: string
  passed: boolean
}

export function passwordRules(password: string, factoryPassword: string): PasswordRule[] {
  return [
    {
      id: 'length',
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      passed: password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH,
    },
    { id: 'letter', label: 'Contains a letter', passed: /[a-zA-Z]/.test(password) },
    { id: 'number', label: 'Contains a number', passed: /\d/.test(password) },
    {
      id: 'not-factory',
      label: 'Different from the factory password',
      passed: password.length > 0 && password !== factoryPassword,
    },
  ]
}

export function passwordAccepted(password: string, factoryPassword: string): boolean {
  return passwordRules(password, factoryPassword).every((rule) => rule.passed)
}

export type PasswordStrength = 'weak' | 'fair' | 'strong'

export function passwordStrength(password: string): { level: PasswordStrength; score: number } {
  if (!password) return { level: 'weak', score: 0 }
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  const level: PasswordStrength = score >= 4 ? 'strong' : score >= 3 ? 'fair' : 'weak'
  return { level, score: Math.min(5, score) }
}

/** Masks a password for display: FRISA-4821 becomes FR••••••21. */
export function maskPassword(password: string): string {
  if (password.length <= 4) return '•'.repeat(password.length)
  return password.slice(0, 2) + '•'.repeat(password.length - 4) + password.slice(-2)
}
