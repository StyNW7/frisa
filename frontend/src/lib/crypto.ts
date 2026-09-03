/**
 * Small self-contained SHA-256 plus the helpers the device pairing flow needs.
 *
 * Why not `crypto.subtle`: it is only exposed in secure contexts, and this prototype
 * is often demonstrated from a phone over a plain-http LAN address. A pure
 * implementation keeps pairing working everywhere. `crypto.getRandomValues` is
 * available in insecure contexts too, so randomness still comes from the platform.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))

export function sha256(input: Uint8Array): Uint8Array {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])

  const bitLength = input.length * 8
  // The message, a 0x80 byte and a 64 bit length, rounded up to whole 64 byte blocks.
  // Must not add a spare block when `length + 9` is already an exact multiple of 64.
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64
  const buffer = new Uint8Array(paddedLength)
  buffer.set(input)
  buffer[input.length] = 0x80
  // 64 bit big-endian length; the high word stays zero for anything this app hashes.
  new DataView(buffer.buffer).setUint32(paddedLength - 4, bitLength >>> 0, false)
  new DataView(buffer.buffer).setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false)

  const w = new Uint32Array(64)
  const view = new DataView(buffer.buffer)

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4, false)
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, hh] = h

    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (hh + S1 + ch + K[i] + w[i]) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0

      hh = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h[0] = (h[0] + a) >>> 0
    h[1] = (h[1] + b) >>> 0
    h[2] = (h[2] + c) >>> 0
    h[3] = (h[3] + d) >>> 0
    h[4] = (h[4] + e) >>> 0
    h[5] = (h[5] + f) >>> 0
    h[6] = (h[6] + g) >>> 0
    h[7] = (h[7] + hh) >>> 0
  }

  const out = new Uint8Array(32)
  const outView = new DataView(out.buffer)
  for (let i = 0; i < 8; i += 1) outView.setUint32(i * 4, h[i], false)
  return out
}

const encoder = new TextEncoder()

export function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

export function sha256Hex(text: string): string {
  return toHex(sha256(encoder.encode(text)))
}

/** Cryptographically random hex string, used for salts and pairing tokens. */
export function randomHex(bytes = 16): string {
  const buffer = new Uint8Array(bytes)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buffer)
  } else {
    for (let i = 0; i < bytes; i += 1) buffer[i] = Math.floor(Math.random() * 256)
  }
  return toHex(buffer)
}

/** Iteration count for the pairing digest: enough to be deliberate, fast enough to feel instant. */
export const PAIRING_ITERATIONS = 12000

/**
 * Salted, iterated digest of a pairing password.
 *
 * A real FRISA hub would run a memory-hard KDF (Argon2/scrypt) inside its firmware
 * and never expose the digest at all. This stands in for that so the prototype can
 * demonstrate the flow without a backend - the password itself is never stored.
 */
export function derivePairingDigest(password: string, salt: string, iterations = PAIRING_ITERATIONS): string {
  let digest = sha256(encoder.encode(`frisa-pairing:${salt}:${password}`))
  const saltBytes = encoder.encode(salt)
  const block = new Uint8Array(digest.length + saltBytes.length)
  for (let i = 1; i < iterations; i += 1) {
    block.set(digest, 0)
    block.set(saltBytes, digest.length)
    digest = sha256(block)
  }
  return toHex(digest)
}

/** Length-independent comparison, so a wrong password never leaks timing information. */
export function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < length; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}
