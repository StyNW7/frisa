/**
 * Generates the FRISA PWA icon set.
 *
 * Draws the same mark the app renders in `src/components/common/FrisaMark.tsx`,
 * rasterised with 4x supersampling and written as PNG using only Node built-ins,
 * so the icons stay reproducible without adding an image dependency.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

/* -------------------------------------------------------------------------- */
/*  PNG encoding                                                               */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* -------------------------------------------------------------------------- */
/*  Geometry helpers - all in the mark's 48 unit coordinate space              */
/* -------------------------------------------------------------------------- */

const hex = (value) => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
]

const GREEN_TOP = hex('#2BC182')
const GREEN_BOTTOM = hex('#136B45')
const WHITE = hex('#FFFFFF')
const FACE = hex('#0D4E34')
const LEAF_ACCENT = hex('#FFD2A6')
const BAR = hex('#D8F3E6')

function insideRoundRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.max(x0 + r, Math.min(x, x1 - r))
  const cy = Math.max(y0 + r, Math.min(y, y1 - r))
  const dx = x - cx
  const dy = y - cy
  if (x >= x0 + r && x <= x1 - r) return y >= y0 && y <= y1
  if (y >= y0 + r && y <= y1 - r) return x >= x0 && x <= x1
  return dx * dx + dy * dy <= r * r
}

function insideCircle(x, y, cx, cy, r) {
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

function insideEllipseRot(x, y, cx, cy, rx, ry, degrees) {
  const a = (degrees * Math.PI) / 180
  const dx = x - cx
  const dy = y - cy
  const ux = dx * Math.cos(a) + dy * Math.sin(a)
  const uy = -dx * Math.sin(a) + dy * Math.cos(a)
  return (ux * ux) / (rx * rx) + (uy * uy) / (ry * ry) <= 1
}

/** Distance to a quadratic bezier, sampled densely enough for a 1.8 unit stroke. */
function nearQuad(x, y, p0, c, p1, halfWidth) {
  let best = Infinity
  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40
    const mt = 1 - t
    const bx = mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0]
    const by = mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1]
    const d = (x - bx) * (x - bx) + (y - by) * (y - by)
    if (d < best) best = d
  }
  return best <= halfWidth * halfWidth
}

function blend(base, layer, alpha) {
  return [
    Math.round(base[0] + (layer[0] - base[0]) * alpha),
    Math.round(base[1] + (layer[1] - base[1]) * alpha),
    Math.round(base[2] + (layer[2] - base[2]) * alpha),
  ]
}

/**
 * Colour of the mark at a point in 48 unit space, or null where it is not drawn.
 * Painter's order matches FrisaMark.tsx.
 */
function markColorAt(mx, my) {
  // bottom status bar
  let result = null
  if (insideRoundRect(mx, my, 18, 37, 30, 39.6, 1.3)) result = { color: BAR, alpha: 0.75 }

  // device body
  if (insideRoundRect(mx, my, 7, 13, 41, 43, 9)) result = { color: WHITE, alpha: 1 }

  // face window
  if (insideRoundRect(mx, my, 12.5, 18.5, 35.5, 33.5, 6)) result = { color: FACE, alpha: 1 }

  // eyes and smile sit on the face
  if (insideCircle(mx, my, 19.5, 25.4, 2.3) || insideCircle(mx, my, 28.5, 25.4, 2.3)) {
    result = { color: WHITE, alpha: 1 }
  }
  if (nearQuad(mx, my, [20.4, 29.4], [24, 31.9], [27.6, 29.4], 0.95)) {
    result = { color: WHITE, alpha: 1 }
  }

  // sprout: a stem with two leaves fanning up and out from the same base at (24, 10)
  if (insideRoundRect(mx, my, 23.35, 9.2, 24.65, 14, 0.65)) result = { color: WHITE, alpha: 1 }
  if (insideEllipseRot(mx, my, 21.0, 8.0, 4.4, 1.9, 34)) result = { color: LEAF_ACCENT, alpha: 1 }
  if (insideEllipseRot(mx, my, 27.0, 8.0, 4.4, 1.9, -34)) result = { color: WHITE, alpha: 1 }

  return result
}

/* -------------------------------------------------------------------------- */
/*  Rendering                                                                  */
/* -------------------------------------------------------------------------- */

const SAMPLES = 4

/**
 * @param {number} size          output pixels
 * @param {'tile'|'full'} shape  rounded tile with transparent corners, or full bleed
 * @param {number} markScale     fraction of the canvas the mark occupies
 */
function renderIcon(size, shape, markScale) {
  const rgba = Buffer.alloc(size * size * 4)
  const radius = size * 0.225
  const markSize = size * markScale
  const offset = (size - markSize) / 2
  const step = 1 / SAMPLES

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const x = px + (sx + 0.5) * step
          const y = py + (sy + 0.5) * step

          const onCanvas = shape === 'full' || insideRoundRect(x, y, 0, 0, size, size, radius)
          if (!onCanvas) continue

          const t = y / size
          let color = [
            Math.round(GREEN_TOP[0] + (GREEN_BOTTOM[0] - GREEN_TOP[0]) * t),
            Math.round(GREEN_TOP[1] + (GREEN_BOTTOM[1] - GREEN_TOP[1]) * t),
            Math.round(GREEN_TOP[2] + (GREEN_BOTTOM[2] - GREEN_TOP[2]) * t),
          ]

          const mark = markColorAt(((x - offset) / markSize) * 48, ((y - offset) / markSize) * 48)
          if (mark) color = blend(color, mark.color, mark.alpha)

          r += color[0]
          g += color[1]
          b += color[2]
          a += 1
        }
      }

      const total = SAMPLES * SAMPLES
      const i = (py * size + px) * 4
      if (a === 0) continue
      rgba[i] = Math.round(r / a)
      rgba[i + 1] = Math.round(g / a)
      rgba[i + 2] = Math.round(b / a)
      rgba[i + 3] = Math.round((a / total) * 255)
    }
  }

  return encodePNG(size, size, rgba)
}

/* -------------------------------------------------------------------------- */

const TARGETS = [
  // Standard icons: a rounded tile, because platforms show these unmasked.
  ['icon-96.png', 96, 'tile', 0.74],
  ['icon-192.png', 192, 'tile', 0.74],
  ['icon-512.png', 512, 'tile', 0.74],
  // Maskable: full bleed, mark kept inside the 80% safe zone.
  ['maskable-192.png', 192, 'full', 0.56],
  ['maskable-512.png', 512, 'full', 0.56],
  // iOS applies its own mask and dislikes transparency.
  ['apple-touch-icon.png', 180, 'full', 0.72],
  // Browser tab.
  ['favicon-32.png', 32, 'tile', 0.82],
  ['favicon-16.png', 16, 'tile', 0.86],
]

mkdirSync(OUT_DIR, { recursive: true })

for (const [name, size, shape, scale] of TARGETS) {
  const png = renderIcon(size, shape, scale)
  writeFileSync(join(OUT_DIR, name), png)
  console.log(`${name.padEnd(24)} ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB`)
}

console.log(`\nWrote ${TARGETS.length} icons to public/icons/`)
